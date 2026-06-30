/** Küçük className birleştirici — koşullu sınıflar için (clsx'e gerek yok). */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
