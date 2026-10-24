import { NextRequest, NextResponse } from "next/server";
import { assertPublicUrl, GuardError } from "./guard";

export const runtime = "nodejs"; // guard node:dns kullanır
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 10_000;

/**
 * Proxy yanıtı her zaman sandbox'lı: doğrudan /api/proxy?url=… açılsa bile
 * (iframe dışında) sayfa opak origin'de çalışır, uygulamanın localStorage/OPFS'ine erişemez.
 */
const SAFE_HEADERS = {
  "Content-Security-Policy": "sandbox allow-scripts allow-forms",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

/** Her yönlendirme adımını guard'dan geçirerek getir (redirect ile iç ağa kaçış yok). */
async function fetchPublic(raw: string): Promise<{ res: Response; url: URL }> {
  let next = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicUrl(next);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      next = new URL(location, url).href;
      continue;
    }
    return { res, url };
  }
  throw new GuardError("Too many redirects", 508);
}

/** Gövdeyi en fazla MAX_BYTES oku; aşarsa 413. */
async function readLimited(res: Response): Promise<ArrayBuffer> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) throw new GuardError("Response too large", 413);
  const reader = res.body?.getReader();
  if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new GuardError("Response too large", 413);
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out.buffer;
}

const escAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/**
 * Sandbox'lı sayfa içinde çalışır: son URL'yi bildirir, link tıklamalarını ve GET
 * formlarını ana pencereye devreder (Browser bunları proxy üzerinden açar).
 */
function bridgeScript(finalUrl: string): string {
  const url = JSON.stringify(finalUrl).replace(/</g, "\\u003c");
  return `<script>(function(){
var send=function(m){try{parent.postMessage(m,"*")}catch(e){}};
send({type:"retro-nav",url:${url}});
document.addEventListener("click",function(e){
var a=e.target&&e.target.closest&&e.target.closest("a[href]");
if(!a||e.defaultPrevented||/^javascript:/i.test(a.getAttribute("href")||""))return;
var h=a.href;if(!/^https?:/i.test(h))return;
e.preventDefault();
if(h.split("#")[0]===${url}.split("#")[0]){var id=decodeURIComponent(h.split("#")[1]||"");var t=id&&(document.getElementById(id)||document.getElementsByName(id)[0]);if(t)t.scrollIntoView();return}
send({type:"retro-open",url:h});
},true);
document.addEventListener("submit",function(e){
var f=e.target;if(!f||(f.method||"get").toLowerCase()!=="get")return;
e.preventDefault();var u=new URL(f.action||${url});
new FormData(f).forEach(function(v,k){if(typeof v==="string")u.searchParams.append(k,v)});
send({type:"retro-open",url:u.href});
},true);
})();</script>`;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new NextResponse("Missing url parameter", { status: 400, headers: SAFE_HEADERS });

  try {
    const { res, url } = await fetchPublic(raw);
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const body = await readLimited(res);

    if (!contentType.includes("text/html")) {
      return new NextResponse(body, {
        status: res.status,
        headers: { ...SAFE_HEADERS, "Content-Type": contentType },
      });
    }

    const charset = /charset=([^;]+)/i.exec(contentType)?.[1]?.trim();
    let html: string;
    try {
      html = new TextDecoder(charset || "utf-8").decode(body);
    } catch {
      html = new TextDecoder().decode(body); // bilinmeyen charset etiketi
    }
    // göreli asset'ler orijinal siteden yüklensin + köprü script'i en başta
    const inject = `<base href="${escAttr(url.href)}">\n${bridgeScript(url.href)}`;
    html = /<head[^>]*>/i.test(html)
      ? html.replace(/<head[^>]*>/i, (m) => `${m}\n${inject}`)
      : `${inject}\n${html}`;
    // frame-busting script'leri etkisizleştir (sandbox zaten top navigasyonunu engeller)
    html = html.replace(/top\.location/gi, "window.location").replace(/parent\.location/gi, "window.location");

    return new NextResponse(html, {
      status: res.status,
      headers: { ...SAFE_HEADERS, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    const status = error instanceof GuardError ? error.status : 502;
    const message = error instanceof GuardError ? error.message : "Upstream fetch failed";
    return new NextResponse(message, { status, headers: { ...SAFE_HEADERS, "Content-Type": "text/plain" } });
  }
}
