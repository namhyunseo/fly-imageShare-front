"use client";

// 빔 전용 폴라로이드 플로팅 무대 (시안 mockup.html의 startStage 이식).
// 화면을 충돌 회피로 흩뿌리고, 각 카드는 두 주파수를 섞은 궤도로 천천히
// 표류한다. 주기적으로 한 장씩 새 사진으로 교체된다.
import { useEffect, useRef } from "react";
import { oikosName } from "@/lib/data";
import type { Photo } from "@/lib/types";

interface Card {
  el: HTMLDivElement;
  hx: number; hy: number;
  cardW: number; cardH: number; imgH: number;
  pidx: number;
  ax: number; ay: number;
  sx: number; sy: number;
  px: number; py: number;
  wob: number;
  baseRot: number; rotAmp: number;
  sr: number; pr: number;
}

function fill(el: HTMLDivElement, p: Photo) {
  el.innerHTML =
    `<img class="ph" src="${p.url}" alt=""${
      p.fallbackUrl
        ? ` onerror="this.onerror=null;this.src='${p.fallbackUrl}'"`
        : ""
    }>` +
    `<div class="cap"><span class="t">${p.comment}</span>` +
    `<span class="o">${oikosName(p.oikosId)}</span></div>`;
}

export function FloatingStage({ photos }: { photos: Photo[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let raf = 0;
    let swapTimer: ReturnType<typeof setInterval> | null = null;
    let cards: Card[] = [];
    let start = performance.now();
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    function build() {
      const pics = photosRef.current;
      if (!stage || !pics.length) return;
      stage.querySelectorAll(".float").forEach((f) => f.remove());
      cards = [];

      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const topPad = 92;
      const botPad = 46;
      const small = W < 760;
      const n = Math.min(small ? 6 : 9, pics.length);

      const unit = Math.max(
        small ? 150 : 168,
        Math.min(W / (small ? 2.4 : 4.3), 260),
      );
      const sizeForRank = (rank: number) =>
        rank < (small ? 1 : 2) ? unit * 1.42
        : rank < (small ? 3 : 5) ? unit * 1.04
        : unit * 0.82;

      // 충돌 회피 배치: 큰 카드부터 자리 확보
      const placed: { x: number; y: number; reach: number }[] = [];
      function place(cardW: number, cardH: number, amp: number) {
        const reach = Math.hypot(cardW, cardH) / 2 + amp;
        for (let gap = 1.0; gap >= 0.55; gap -= 0.15) {
          for (let k = 0; k < 80; k++) {
            const x = rnd(reach + 8, W - reach - 8);
            const y = rnd(topPad + reach, H - botPad - reach);
            const ok = placed.every(
              (q) => Math.hypot(q.x - x, q.y - y) > (q.reach + reach) * gap,
            );
            if (ok) {
              placed.push({ x, y, reach });
              return { x, y };
            }
          }
        }
        const p = {
          x: rnd(W * 0.2, W * 0.8),
          y: rnd(topPad + 60, H - botPad - 60),
          reach,
        };
        placed.push(p);
        return p;
      }

      const RATIOS = [0.72, 0.78, 0.95, 1.0, 1.22];
      for (let i = 0; i < n; i++) {
        const cardW = Math.round(sizeForRank(i));
        const imgH = Math.round(
          cardW * RATIOS[Math.floor(Math.random() * RATIOS.length)],
        );
        // 캡션 글자 크기를 카드 너비에 비례 → 큰 빔 화면에서도 가독
        const cap = Math.max(13, Math.round(cardW * 0.085));
        const capO = Math.max(11, Math.round(cardW * 0.058));
        const capH = Math.round(8 + cap * 1.3 + 4 + capO * 1.3);
        const cardH = imgH + capH; // 사진 + 아래 텍스트 영역
        const amp = 12 + Math.random() * (i < 2 ? 10 : 20);
        const home = place(cardW, cardH, amp);

        const el = document.createElement("div");
        el.className = "float";
        el.style.width = cardW + "px";
        el.style.zIndex = String(40 - i);
        el.style.opacity = "0";
        el.style.setProperty("--cap", cap + "px");
        el.style.setProperty("--capo", capO + "px");
        fill(el, pics[i]);
        stage.appendChild(el);
        (el.querySelector(".ph") as HTMLElement).style.height = imgH + "px";

        cards.push({
          el, hx: home.x, hy: home.y, cardW, cardH, imgH, pidx: i,
          ax: amp * (0.7 + Math.random() * 0.6),
          ay: amp * (0.7 + Math.random() * 0.6),
          sx: 0.07 + Math.random() * 0.13,
          sy: 0.07 + Math.random() * 0.13,
          px: Math.random() * Math.PI * 2,
          py: Math.random() * Math.PI * 2,
          wob: 1.7 + Math.random() * 1.1,
          baseRot: Math.random() * 3 - 1.5,
          rotAmp: 0.4 + Math.random() * 1,
          sr: 0.08 + Math.random() * 0.16,
          pr: Math.random() * Math.PI * 2,
        });
        requestAnimationFrame(() => (el.style.opacity = "1"));
      }
      start = performance.now();
    }

    function loop(now: number) {
      const t = (now - start) / 1000;
      for (const c of cards) {
        const x =
          c.hx - c.cardW / 2 +
          c.ax * Math.sin(t * c.sx + c.px) +
          c.ax * 0.32 * Math.sin(t * c.sx * c.wob + c.py);
        const y =
          c.hy - c.cardH / 2 +
          c.ay * Math.sin(t * c.sy + c.py) +
          c.ay * 0.32 * Math.cos(t * c.sy * c.wob + c.px);
        const rot = c.baseRot + c.rotAmp * Math.sin(t * c.sr + c.pr);
        c.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(
          1,
        )}px) rotate(${rot.toFixed(2)}deg)`;
      }
      raf = requestAnimationFrame(loop);
    }

    function swapOne() {
      const pics = photosRef.current;
      if (!cards.length || !pics.length) return;
      const c = cards[Math.floor(Math.random() * cards.length)];
      c.pidx = (c.pidx + cards.length) % pics.length;
      c.el.style.opacity = "0";
      setTimeout(() => {
        fill(c.el, pics[c.pidx]);
        (c.el.querySelector(".ph") as HTMLElement).style.height = c.imgH + "px";
        c.el.style.opacity = "1";
      }, 600);
    }

    build();
    raf = requestAnimationFrame(loop);
    swapTimer = setInterval(swapOne, 3400);

    const ro = new ResizeObserver(() => build());
    ro.observe(stage);

    return () => {
      cancelAnimationFrame(raf);
      if (swapTimer) clearInterval(swapTimer);
      ro.disconnect();
      cards = [];
    };
  }, []);

  return <div ref={stageRef} className="stage" />;
}
