import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return new NextResponse("Missing url parameter", { status: 400 });

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      },
    });

    const contentType = res.headers.get("content-type") || "";
    
    if (contentType.includes("text/html")) {
      let html = await res.text();
      
      // Inject base tag for relative assets
      const baseTag = `<base href="${url}">`;
      if (html.toLowerCase().includes("<head>")) {
        html = html.replace(/<head>/i, `<head>\n${baseTag}`);
      } else {
        html = baseTag + "\n" + html;
      }
      
      // Rewrite links so navigation stays within the proxy
      html = html.replace(/<a\s+(?:[^>]*?\s+)?href=(['"])(.*?)\1/gi, (match, quote, href) => {
        if (href.startsWith("data:") || href.startsWith("#") || href.startsWith("javascript:")) return match;
        
        try {
          const absoluteUrl = new URL(href, url).href;
          if (absoluteUrl.startsWith("http")) {
            return match.replace(`href=${quote}${href}${quote}`, `href=${quote}/api/proxy?url=${encodeURIComponent(absoluteUrl)}${quote}`);
          }
        } catch (e) {
          // ignore invalid URLs
        }
        return match;
      });

      // Strip common frame breaking scripts
      html = html.replace(/top\.location/gi, "window.location");
      html = html.replace(/parent\.location/gi, "window.location");

      return new NextResponse(html, {
        status: res.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-cache",
          // Explicity no X-Frame-Options or CSP to allow iframe embedding
        },
      });
    }

    // Proxy other assets
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
      },
    });

  } catch (error) {
    return new NextResponse(`Error fetching: ${(error as Error).message}`, { status: 500 });
  }
}
