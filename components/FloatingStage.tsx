"use client";

// 빔 전용 정적 배치 무대.
// 격자가 아니라 충돌 회피로 흩뿌린다 — 위치는 랜덤이되 서로 겹치지 않게.
// 화면 중앙에 가까울수록 크게 두고, 사진은 원본 비율을 유지한다.
import { useEffect, useRef } from "react";
import { imageSrc } from "@/lib/api";
import type { Photo } from "@/lib/types";

type Slot = { x: number; y: number; reach: number; d2: number };

/** 원본 비율(height/width). 크기 데이터가 없으면 1:1 폴백. */
function ratioOf(p: Photo): number {
  return p.width && p.height ? p.height / p.width : 1;
}

/** 카드 너비에 따른 캡션 글자/높이 */
function capInfo(cardW: number) {
  const cap = Math.max(13, Math.round(cardW * 0.085));
  const capO = Math.max(11, Math.round(cardW * 0.058));
  return { cap, capO, capH: Math.round(8 + cap * 1.3 + 4 + capO * 1.3) };
}

function fill(el: HTMLDivElement, p: Photo) {
  el.innerHTML =
    `<img class="ph" src="${imageSrc(p.imageUrl)}" alt="">` +
    `<div class="cap"><span class="t">${p.comment}</span>` +
    `<span class="o">${p.groupName}</span></div>`;
}

export function FloatingStage({ photos }: { photos: Photo[] }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    function build() {
      if (!stage || !photos.length) return;
      stage.querySelectorAll(".float").forEach((f) => f.remove());
      const W = stage.clientWidth, H = stage.clientHeight;
      const small = W < 760;
      const n = Math.min(small ? 8 : 12, photos.length);
      const cx = W / 2, cy = H / 2;
      const maxR = Math.hypot(W / 2, H / 2);
      const topPad = small ? 56 : 80, botPad = 44;

      // 중앙 거리(d2) → 카드 너비. 중앙이 크고 가장자리가 작다.
      const big = Math.min(W, H) * (small ? 0.36 : 0.26);
      const sml = Math.min(W, H) * (small ? 0.20 : 0.14);
      const sizeFor = (d2: number) => big - (big - sml) * d2;

      // 충돌 회피 배치 — 위치를 랜덤 시도하고, 각 카드의 실제 비율로
      // 충돌 반경(reach)을 정확히 계산해 겹치지 않는 자리를 찾는다.
      const placed: Slot[] = [];
      function place(ratio: number): { s: Slot; cardW: number } {
        for (let gap = 1.0; gap >= 0.56; gap -= 0.06) {
          for (let k = 0; k < 220; k++) {
            const x = rnd(0, W), y = rnd(topPad, H - botPad);
            const d2 = Math.hypot(x - cx, y - cy) / maxR;
            const cardW = sizeFor(d2);
            const cardH = cardW * ratio + capInfo(cardW).capH;
            const reach = Math.hypot(cardW, cardH) / 2;
            if (x < reach + 6 || x > W - reach - 6 || y < topPad + reach || y > H - botPad - reach) continue;
            if (placed.every((q) => Math.hypot(q.x - x, q.y - y) > (q.reach + reach) * gap)) {
              const s = { x, y, reach, d2 };
              placed.push(s);
              return { s, cardW };
            }
          }
        }
        // 폴백: 중앙 근처 (거의 도달하지 않음)
        const x = rnd(W * 0.3, W * 0.7), y = rnd(H * 0.3, H * 0.7);
        const d2 = Math.hypot(x - cx, y - cy) / maxR;
        const s = { x, y, reach: 0, d2 };
        placed.push(s);
        return { s, cardW: sizeFor(d2) };
      }

      for (let i = 0; i < n; i++) {
        const p = photos[i];
        const { s, cardW: cw } = place(ratioOf(p));
        const cardW = Math.round(cw);
        const ci = capInfo(cardW);
        const imgH = Math.round(cardW * ratioOf(p));
        const cardH = imgH + ci.capH;

        const el = document.createElement("div");
        el.className = "float";
        el.style.width = cardW + "px";
        el.style.opacity = "0";
        el.style.zIndex = String(100 - Math.round(s.d2 * 100)); // 중앙이 위로
        el.style.setProperty("--cap", ci.cap + "px");
        el.style.setProperty("--capo", ci.capO + "px");
        fill(el, p);
        (el.querySelector(".ph") as HTMLElement).style.height = imgH + "px";

        const rot = rnd(-6, 6);
        el.style.transform =
          `translate(${(s.x - cardW / 2).toFixed(1)}px, ${(s.y - cardH / 2).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
        stage!.appendChild(el);
        // 살짝 시차를 둔 페이드인 (CSS transition)
        setTimeout(() => { el.style.opacity = "1"; }, i * 55);
      }
    }

    build();
    const ro = new ResizeObserver(() => build());
    ro.observe(stage);
    return () => ro.disconnect();
  }, [photos]);

  return <div ref={stageRef} className="stage" />;
}
