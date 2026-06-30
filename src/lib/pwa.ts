"use client";

/** Service worker kaydı — yalnızca production'da (serwist dev'de devre dışı). */
export function registerServiceWorker() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    process.env.NODE_ENV !== "production"
  ) {
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sessizce yok say — offline kabuk kritik değil */
    });
  });
}
