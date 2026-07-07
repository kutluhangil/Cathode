"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Op = "+" | "−" | "×" | "÷";

function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

// Modül seviyesinde sabit tip — Calculator içinde tanımlanırsa her render'da yeni
// component tipi olur, pencere odak re-render'ı butonu remount edip tıklamayı yer.
function Key({
  label,
  on,
  wide,
  accent,
}: {
  label: string;
  on: () => void;
  wide?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      data-testid={`calc-key-${label}`}
      onClick={on}
      className={cn(
        "flex items-center justify-center rounded-btn py-3 font-mono text-lg transition-colors",
        wide && "col-span-2",
        accent
          ? "bg-accent text-accent-ink hover:brightness-110"
          : "bg-surface-2 text-text hover:bg-surface-3",
      )}
    >
      {label}
    </button>
  );
}

/** Retro hesap makinesi — saf durum makinesi (eval yok). */
export function Calculator() {
  const [display, setDisplay] = useState("0");
  const [acc, setAcc] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [fresh, setFresh] = useState(true); // sonraki rakam yeni sayı başlatır

  const inputDigit = useCallback(
    (d: string) => {
      setDisplay((cur) => (fresh || cur === "0" ? d : cur + d));
      setFresh(false);
    },
    [fresh],
  );

  const inputDot = useCallback(() => {
    setDisplay((cur) => (fresh ? "0." : cur.includes(".") ? cur : cur + "."));
    setFresh(false);
  }, [fresh]);

  const clear = useCallback(() => {
    setDisplay("0");
    setAcc(null);
    setOp(null);
    setFresh(true);
  }, []);

  const chooseOp = useCallback(
    (next: Op) => {
      const val = parseFloat(display);
      if (acc === null) setAcc(val);
      else if (op) setAcc((a) => (a === null ? val : apply(a, val, op)));
      setOp(next);
      setFresh(true);
    },
    [display, acc, op],
  );

  const equals = useCallback(() => {
    if (op === null || acc === null) return;
    const val = parseFloat(display);
    const res = apply(acc, val, op);
    setDisplay(Number.isFinite(res) ? String(res) : "hata");
    setAcc(null);
    setOp(null);
    setFresh(true);
  }, [op, acc, display]);

  const negate = () =>
    setDisplay((c) =>
      c.startsWith("-") ? c.slice(1) : c === "0" ? c : "-" + c,
    );
  const percent = () => setDisplay((c) => String(parseFloat(c) / 100));
  const backspace = () => setDisplay((c) => (c.length > 1 ? c.slice(0, -1) : "0"));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") inputDigit(e.key);
      else if (e.key === ".") inputDot();
      else if (e.key === "+") chooseOp("+");
      else if (e.key === "-") chooseOp("−");
      else if (e.key === "*") chooseOp("×");
      else if (e.key === "/") {
        e.preventDefault();
        chooseOp("÷");
      } else if (e.key === "Enter" || e.key === "=") equals();
      else if (e.key === "Escape") clear();
      else if (e.key === "Backspace") backspace();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputDot, chooseOp, equals, clear]);

  return (
    <div className="flex h-full flex-col gap-2 bg-surface-0 p-3">
      <div
        data-testid="calc-display"
        className="flex items-center justify-end rounded-ui bg-black/40 px-4 py-4 font-mono text-3xl tabular-nums text-text"
      >
        {display}
      </div>
      <div className="grid flex-1 grid-cols-4 gap-1.5">
        <Key label="C" on={clear} />
        <Key label="±" on={negate} />
        <Key label="%" on={percent} />
        <Key label="÷" on={() => chooseOp("÷")} accent />
        <Key label="7" on={() => inputDigit("7")} />
        <Key label="8" on={() => inputDigit("8")} />
        <Key label="9" on={() => inputDigit("9")} />
        <Key label="×" on={() => chooseOp("×")} accent />
        <Key label="4" on={() => inputDigit("4")} />
        <Key label="5" on={() => inputDigit("5")} />
        <Key label="6" on={() => inputDigit("6")} />
        <Key label="−" on={() => chooseOp("−")} accent />
        <Key label="1" on={() => inputDigit("1")} />
        <Key label="2" on={() => inputDigit("2")} />
        <Key label="3" on={() => inputDigit("3")} />
        <Key label="+" on={() => chooseOp("+")} accent />
        <Key label="0" on={() => inputDigit("0")} wide />
        <Key label="." on={inputDot} />
        <Key label="=" on={equals} accent />
      </div>
    </div>
  );
}
