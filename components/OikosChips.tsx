"use client";

import { GROUPS } from "@/lib/data";

/** 오이코스(그룹) 선택 칩. groupName("1-1")을 그대로 표시·전달. */
export function OikosChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (groupName: string) => void;
}) {
  return (
    <div className="my-2 flex flex-wrap gap-2">
      {GROUPS.map((g) => {
        const on = g === value;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`rounded-full border px-3.5 py-2 text-[13px] font-semibold transition ${
              on
                ? "border-[var(--accent2)] bg-[var(--accent2)] text-white"
                : "border-[var(--line)] bg-[var(--card)] text-[var(--muted)]"
            }`}
          >
            {g}
          </button>
        );
      })}
    </div>
  );
}
