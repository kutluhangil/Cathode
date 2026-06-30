// Emülatör binary'lerini public/ altına hazırlar (git'e gömülmez, idempotent).
// v86 + js-dos node_modules'tan kopyalanır; BIOS + KolibriOS ağdan indirilir.
import { existsSync, mkdirSync, cpSync, copyFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";

const log = (m) => console.log(`[setup-emu] ${m}`);

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

async function download(url, dest) {
  if (existsSync(dest)) {
    log(`atlandı (var): ${dest}`);
    return;
  }
  log(`indiriliyor: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`indirme başarısız ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  log(`yazıldı: ${dest} (${buf.length} byte)`);
}

function copyIfMissing(src, dest, recursive = false) {
  if (existsSync(dest)) {
    log(`atlandı (var): ${dest}`);
    return;
  }
  if (!existsSync(src)) {
    log(`UYARI kaynak yok, atlanıyor: ${src}`);
    return;
  }
  if (recursive) cpSync(src, dest, { recursive: true });
  else copyFileSync(src, dest);
  log(`kopyalandı: ${dest}`);
}

async function main() {
  // v86
  ensureDir("public/v86");
  copyIfMissing("node_modules/v86/build/v86.wasm", "public/v86/v86.wasm");
  await download(
    "https://raw.githubusercontent.com/copy/v86/master/bios/seabios.bin",
    "public/v86/seabios.bin",
  );
  await download(
    "https://raw.githubusercontent.com/copy/v86/master/bios/vgabios.bin",
    "public/v86/vgabios.bin",
  );

  // js-dos v8
  ensureDir("public/jsdos");
  copyIfMissing("node_modules/js-dos/dist/js-dos.js", "public/jsdos/js-dos.js");
  copyIfMissing(
    "node_modules/js-dos/dist/js-dos.css",
    "public/jsdos/js-dos.css",
  );
  copyIfMissing(
    "node_modules/js-dos/dist/emulators",
    "public/jsdos/emulators",
    true,
  );

  // KolibriOS (GPL, serbest) — gömülü demo OS
  ensureDir("public/images");
  await download(
    "https://copy.sh/v86/images/kolibri.img",
    "public/images/kolibri.img",
  );

  log("tamam.");
}

main().catch((e) => {
  console.error("[setup-emu] HATA:", e.message);
  process.exit(1);
});
