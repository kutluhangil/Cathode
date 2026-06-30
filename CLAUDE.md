# CLAUDE.md — Cathode

## Git / sürüm yönetimi (MUTLAK kurallar)
- ASLA `git commit` veya `git push` çalıştırma. Tüm commit ve push işlemlerini Kutluhan elle yapar.
- ASLA branch oluşturma (`git branch`, `git checkout -b` yok). Aksi söylenmedikçe mevcut branch'te çalış.
- Commit'lere ASLA `Co-Authored-By: Claude` veya herhangi bir Claude/AI atıfı ekleme.
- GitHub "Contributors" listesinde SADECE Kutluhan görünmelidir. Claude asla görünmez.
- Bir iş bittiğinde: değişiklikleri özetle, hangi dosyaların değiştiğini söyle ve "commit etmeye hazır" de — commit'i Kutluhan'a bırak.

## Çalışma biçimi
- Bu spec'i (CATHODE_BUILD_SPEC.md) faz faz uygula. Bir fazı bitirmeden sonrakine geçme.
- Her fazın sonunda o fazın "Definition of Done" maddelerini kontrol et.
- Kod açık, tipli (TypeScript strict) ve yorum gerektiren yerlerde kısa yorumlu olsun.
- Yeni bağımlılık eklemeden önce gerekçesini bir cümleyle belirt.

## Stack kararları (sapma yok)
- Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS + Framer Motion
- State: hafif (Zustand) — gereksiz global store kurma
- Login yok, veritabanı yok, ödeme yok, analytics yok (privacy-first kalır)
- Persistans: tarayıcıda (localStorage / OPFS) — sunucu state yok
