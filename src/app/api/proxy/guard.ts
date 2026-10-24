import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/** Proxy'nin reddettiği istekler — mesaj kullanıcıya gösterilir, status yanıta yazılır. */
export class GuardError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

function v4Private(ip: string): boolean {
  const [a, b, c] = ip.split(".").map(Number);
  return (
    a === 0 || // "this" ağı
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    (a === 169 && b === 254) || // link-local / bulut metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0 && (c === 0 || c === 2)) || // IETF + TEST-NET-1
    (a === 198 && (b === 18 || b === 19)) || // benchmark
    a >= 224 // multicast + reserved + broadcast
  );
}

/** IPv4-mapped IPv6 (::ffff:a.b.c.d veya ::ffff:7f00:1) → IPv4, değilse null. */
function mappedV4(ip: string): string | null {
  const m = /^::ffff:(?:0:)?(.+)$/.exec(ip);
  if (!m) return null;
  if (isIP(m[1]) === 4) return m[1];
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(m[1]);
  if (!hex) return null;
  const hi = parseInt(hex[1], 16);
  const lo = parseInt(hex[2], 16);
  return [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
}

/** Özel / loopback / link-local / rezerve adres mi? (ev sunucusunun iç ağını korur) */
export function isPrivateAddress(ip: string): boolean {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, "");
  const kind = isIP(addr);
  if (kind === 4) return v4Private(addr);
  if (kind !== 6) return true; // tanınmayan → güvenli tarafta kal
  const v4 = mappedV4(addr);
  if (v4) return v4Private(v4);
  return (
    addr === "::" ||
    addr === "::1" ||
    /^f[cd]/.test(addr) || // fc00::/7 unique-local
    /^fe[89ab]/.test(addr) || // fe80::/10 link-local
    addr.startsWith("ff") || // multicast
    addr.startsWith("64:ff9b:") || // NAT64 → iç IPv4'e çıkabilir
    addr.startsWith("2001:db8:") // dokümantasyon
  );
}

/**
 * URL'yi doğrula: yalnız http(s), varsayılan port, kimlik bilgisi yok ve
 * host'un çözüldüğü TÜM adresler public olmalı.
 * shortcut: DNS kontrolü ile fetch ayrı çözümleme yapar (rebinding penceresi);
 * proxy herkese açık trafik alırsa undici `connect.lookup` ile sabitlenmeli.
 */
export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new GuardError("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new GuardError("Only http and https URLs are allowed");
  if (url.username || url.password)
    throw new GuardError("URLs with credentials are not allowed");
  if (url.port && url.port !== "80" && url.port !== "443")
    throw new GuardError("Only default ports (80/443) are allowed");

  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local"))
    throw new GuardError("Private addresses are not allowed", 403);

  const addrs = isIP(host)
    ? [host]
    : await lookup(host, { all: true, verbatim: true })
        .then((r) => r.map((a) => a.address))
        .catch(() => {
          throw new GuardError("Host not found", 502);
        });
  if (addrs.length === 0 || addrs.some(isPrivateAddress))
    throw new GuardError("Private addresses are not allowed", 403);
  return url;
}
