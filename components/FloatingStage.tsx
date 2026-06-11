"use client";

// 빔 전용 무대.
// 충돌 회피로 흩뿌려 배치하고(겹침 없음), 각 사진이 제자리(home) 주변을
// 작은 진폭으로 천천히 부유한다. sizeScale/count 로 현장 조절.
import { useEffect, useRef } from "react";
import { imageSrc } from "@/lib/api/client";
import type { Photo } from "@/lib/types";

type Slot = { x: number; y: number; reach: number; d2: number };

interface Card {
  el: HTMLDivElement;
  homeX: number; homeY: number; cardW: number; cardH: number;
  ax: number; ay: number; sx: number; sy: number; px: number; py: number; // 부유
  baseRot: number; rotAmp: number; sr: number; pr: number; // 회전 부유
}

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
    `<span class="o">${p.oikosName}</span></div>`;
}

export function FloatingStage({
  photos,
  sizeScale = 1,
  count,
}: {
  photos: Photo[];
  /** 사진 크기 배율 (현장 조절용) */
  sizeScale?: number;
  /** 표시 개수 (현장 조절용). 없으면 화면 크기 기본값 */
  count?: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    let raf = 0;
    let cards: Card[] = [];
    const start = performance.now();

    function build() {
      if (!stage || !photos.length) return;
      stage.querySelectorAll(".float").forEach((f) => f.remove());
      cards = [];
      const W = stage.clientWidth, H = stage.clientHeight;
      const small = W < 760;
      const slots = count ?? (small ? 8 : 12);
      const n = Math.min(slots, photos.length);
      const cx = W / 2, cy = H / 2;
      const maxR = Math.hypot(W / 2, H / 2);
      const topPad = small ? 56 : 80, botPad = 44;

      const big = Math.min(W, H) * (small ? 0.32 : 0.23) * sizeScale;
      const sml = Math.min(W, H) * (small ? 0.19 : 0.13) * sizeScale;
      const maxCardH = H * 0.42 * sizeScale; // 세로 긴 사진 높이 상한
      const sizeForD = (d2: number) => big - (big - sml) * d2;
      const widthFor = (d2: number, ratio: number) =>
        Math.min(sizeForD(d2), maxCardH / (ratio + 0.2));

      // 충돌 회피 배치 — 자리를 못 찾으면 카드를 점점 줄여서라도 무겹침 보장.
      const placed: Slot[] = [];
      function place(ratio: number): { s: Slot; cardW: number } {
        for (let scale = 1; scale >= 0.5; scale -= 0.1) {
          for (let gap = 1.0; gap >= 0.8; gap -= 0.05) {
            for (let k = 0; k < 140; k++) {
              const x = rnd(0, W), y = rnd(topPad, H - botPad);
              const d2 = Math.hypot(x - cx, y - cy) / maxR;
              const cardW = widthFor(d2, ratio) * scale;
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
        }
        const cardW = widthFor(1, ratio) * 0.5;
        const cardH = cardW * ratio + capInfo(cardW).capH;
        const reach = Math.hypot(cardW, cardH) / 2;
        const x = rnd(reach + 6, W - reach - 6), y = rnd(topPad + reach, H - botPad - reach);
        const d2 = Math.hypot(x - cx, y - cy) / maxR;
        const s = { x, y, reach, d2 };
        placed.push(s);
        return { s, cardW };
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

        const baseRot = rnd(-5, 5);
        el.style.transform =
          `translate(${(s.x - cardW / 2).toFixed(1)}px, ${(s.y - cardH / 2).toFixed(1)}px) rotate(${baseRot}deg)`;
        stage!.appendChild(el);
        // 살짝 시차를 둔 페이드인 (CSS transition)
        setTimeout(() => { el.style.opacity = "1"; }, i * 55);

        // 작은 부유 파라미터 (진폭 작게, 천천히)
        cards.push({
          el, homeX: s.x, homeY: s.y, cardW, cardH,
          ax: rnd(4, 9), ay: rnd(4, 9),
          sx: rnd(0.18, 0.4), sy: rnd(0.18, 0.4),
          px: rnd(0, 6.28), py: rnd(0, 6.28),
          baseRot, rotAmp: rnd(0.3, 0.9),
          sr: rnd(0.12, 0.28), pr: rnd(0, 6.28),
        });
      }
    }

    function loop(now: number) {
      const t = (now - start) / 1000;
      for (const c of cards) {
        const x = c.homeX + c.ax * Math.sin(t * c.sx + c.px);
        const y = c.homeY + c.ay * Math.sin(t * c.sy + c.py);
        const rot = c.baseRot + c.rotAmp * Math.sin(t * c.sr + c.pr);
        c.el.style.transform =
          `translate(${(x - c.cardW / 2).toFixed(1)}px, ${(y - c.cardH / 2).toFixed(1)}px) rotate(${rot.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(loop);
    }

    build();
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(() => build());
    ro.observe(stage);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [photos, sizeScale, count]);

  return <div ref={stageRef} className="stage" />;
}
