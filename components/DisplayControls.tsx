"use client";

// 빔(/display) 현장 조절 패널. ⚙️ 토글로 열고, 사진 크기·개수를
// 실시간 조절한다. 값은 호출측(display 페이지)이 localStorage에 저장.
import { useState } from "react";

export function DisplayControls({
  sizeScale,
  count,
  maxCount,
  onSizeScale,
  onCount,
}: {
  sizeScale: number;
  count: number;
  maxCount: number;
  onSizeScale: (v: number) => void;
  onCount: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute left-4 top-4 z-30">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="빔 조절 패널"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[16px] text-white/55 backdrop-blur transition hover:bg-white/20 hover:text-white"
      >
        ⚙️
      </button>

      {open && (
        <div className="mt-2 w-[240px] rounded-2xl border border-white/10 bg-black/75 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <div className="mb-3 text-[12px] font-bold tracking-tight text-white/80">
            빔 조절 (현장용)
          </div>

          <label className="mb-1 flex items-center justify-between text-[11.5px] text-white/55">
            <span>사진 크기</span>
            <span className="font-bold text-[var(--accent)]">
              {sizeScale.toFixed(2)}×
            </span>
          </label>
          <input
            type="range"
            min={0.5}
            max={1.6}
            step={0.05}
            value={sizeScale}
            onChange={(e) => onSizeScale(Number(e.target.value))}
            className="mb-4 w-full accent-[var(--accent)]"
          />

          <label className="mb-1 flex items-center justify-between text-[11.5px] text-white/55">
            <span>사진 개수</span>
            <span className="font-bold text-[var(--accent)]">{count}</span>
          </label>
          <input
            type="range"
            min={4}
            max={maxCount}
            step={1}
            value={count}
            onChange={(e) => onCount(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />

          <p className="mt-3 text-[10.5px] leading-relaxed text-white/35">
            조절값은 이 기기에 저장돼 새로고침해도 유지돼요.
          </p>
        </div>
      )}
    </div>
  );
}
