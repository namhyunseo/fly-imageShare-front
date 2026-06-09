"use client";

import { OIKOS } from "@/lib/data";

export function OikosChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="my-2 flex flex-wrap gap-2">
      {OIKOS.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
              on
                ? "border-[var(--accent2)] bg-[var(--accent2)] text-white"
                : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}
