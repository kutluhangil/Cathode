/**
 * libv86.mjs Node ortamı bekliyor: `global` ve `global.setImmediate`.
 * v86 import'undan ÖNCE yüklenmeli — import sırası bu modülü önce çalıştırır.
 * setImmediate: MessageChannel tabanlı — setTimeout(0)'ın 4ms clamp'ine
 * takılmaz; v86'nın çalışma döngüsü buna dayanır.
 */

type Task = (...args: unknown[]) => void;

function makeSetImmediate(): (fn: Task, ...args: unknown[]) => void {
  if (typeof MessageChannel === "undefined") {
    return (fn: Task, ...args: unknown[]) => setTimeout(() => fn(...args), 0);
  }
  const queue: Task[] = [];
  const ch = new MessageChannel();
  ch.port1.onmessage = () => {
    const fn = queue.shift();
    fn?.();
  };
  return (fn: Task, ...args: unknown[]) => {
    queue.push(args.length ? () => fn(...args) : fn);
    ch.port2.postMessage(null);
  };
}

if (typeof globalThis !== "undefined") {
  const g = globalThis as Record<string, unknown>;
  if (!("global" in g)) g.global = globalThis;
  if (typeof g.setImmediate !== "function") g.setImmediate = makeSetImmediate();
}

export {};
