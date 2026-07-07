/** POSIX-style path helpers for the virtual filesystem. Pure, no OPFS. */

export function normalize(path: string): string {
  const out: string[] = [];
  for (const p of path.split("/")) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return "/" + out.join("/");
}

export function segments(path: string): string[] {
  return normalize(path).split("/").filter(Boolean);
}

export function join(...parts: string[]): string {
  return normalize(parts.join("/"));
}

export function parent(path: string): string {
  const n = normalize(path);
  const i = n.lastIndexOf("/");
  return i <= 0 ? "/" : n.slice(0, i);
}

export function basename(path: string): string {
  const n = normalize(path);
  return n.slice(n.lastIndexOf("/") + 1);
}
