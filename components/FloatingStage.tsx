"use client";

// 빔 전용 무대.
// 충돌 회피로 흩뿌려 배치하고(겹침 없음), 각 사진이 제자리(home) 주변을
// 작은 진폭으로 천천히 부유한다. sizeScale/count 로 현장 조절.
//
// 갤러리 전체 사진 풀에서 일부만 무대에 띄우고, 주기적으로 절반을
// 풀의 다른(아직 안 보인) 사진으로 교체(셔플)해 전부가 돌아가며 노출된다.
// 새로 업로드된 사진(SSE)은 셔플을 기다리지 않고 즉시 무대에 합류한다.
import { useEffect, useRef } from "react";
import { imageSrc } from "@/lib/api/client";
import type { Photo } from "@/lib/types";

const FADE_MS = 800; // .float 의 opacity 트랜지션과 일치

type Slot = { x: number; y: number; reach: number; d2: number };

interface Card {
  el: HTMLDivElement;
  id: string;
  homeX: number; homeY: number; cardW: number; cardH: number; reach: number; d2: number;
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
  shuffleMs = 6000,
}: {
  photos: Photo[];
  /** 사진 크기 배율 (현장 조절용) */
  sizeScale?: number;
  /** 표시 개수 (현장 조절용). 없으면 화면 크기 기본값 */
  count?: number;
  /** 셔플 주기(ms, 현장 조절용) */
  shuffleMs?: number;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  // 전체 사진 풀(렌더마다 최신값) — 셔플/실시간 합류가 이걸 참조.
  const poolRef = useRef<Photo[]>(photos);
  poolRef.current = photos;
  // 이미 무대 로직이 인지한 사진 id (실시간 합류 중복 방지)
  const seenRef = useRef<Set<string>>(new Set());
  // 무대 명령 API (실시간 합류·셔플) — 메인 이펙트가 채운다.
  const apiRef = useRef<{ addRealtime: (p: Photo) => void; shuffle: () => void } | null>(null);

  // 무대 구성 + 부유 루프 + 셔플 타이머. 기하(크기/개수) 변경 시에만 재구성.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    /** 배열에서 무작위 k개 (Fisher–Yates) */
    const pickSome = <T,>(arr: T[], k: number): T[] => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a.slice(0, Math.max(0, k));
    };

    let raf = 0;
    let cards: Card[] = [];
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const after = (ms: number, fn: () => void) => {
      const t = setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
      return t;
    };
    const start = performance.now();

    // ── 기하 (build/computeGeom에서 설정) ──
    let W = 0, H = 0, cx = 0, cy = 0, maxR = 1, topPad = 0, botPad = 0;
    let big = 0, sml = 0, maxCardH = 0, slots = 0;
    const sizeForD = (d2: number) => big - (big - sml) * d2;
    const widthFor = (d2: number, ratio: number) =>
      Math.min(sizeForD(d2), maxCardH / (ratio + 0.2));

    function computeGeom() {
      W = stage!.clientWidth; H = stage!.clientHeight;
      const small = W < 760;
      slots = count ?? (small ? 8 : 12);
      cx = W / 2; cy = H / 2; maxR = Math.hypot(W / 2, H / 2);
      topPad = small ? 56 : 80; botPad = 44;
      big = Math.min(W, H) * (small ? 0.32 : 0.23) * sizeScale;
      sml = Math.min(W, H) * (small ? 0.19 : 0.13) * sizeScale;
      maxCardH = H * 0.42 * sizeScale;
    }

    // 충돌 회피 배치 — 자리를 못 찾으면 카드를 점점 줄여서라도 무겹침 보장.
    function place(ratio: number, placed: Slot[]): { s: Slot; cardW: number } {
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
              return { s: { x, y, reach, d2 }, cardW };
            }
          }
        }
      }
      const cardW = widthFor(1, ratio) * 0.5;
      const cardH = cardW * ratio + capInfo(cardW).capH;
      const reach = Math.hypot(cardW, cardH) / 2;
      const x = rnd(reach + 6, W - reach - 6), y = rnd(topPad + reach, H - botPad - reach);
      const d2 = Math.hypot(x - cx, y - cy) / maxR;
      return { s: { x, y, reach, d2 }, cardW };
    }

    function makeCard(p: Photo, s: Slot, cardWraw: number, fadeDelay: number): Card {
      const cardW = Math.round(cardWraw);
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
      after(fadeDelay, () => { el.style.opacity = "1"; }); // 시차 페이드인

      return {
        el, id: p.id, homeX: s.x, homeY: s.y, cardW, cardH, reach: s.reach, d2: s.d2,
        ax: rnd(4, 9), ay: rnd(4, 9), sx: rnd(0.18, 0.4), sy: rnd(0.18, 0.4),
        px: rnd(0, 6.28), py: rnd(0, 6.28),
        baseRot, rotAmp: rnd(0.3, 0.9), sr: rnd(0.12, 0.28), pr: rnd(0, 6.28),
      };
    }

    /** 페이드아웃 후 DOM 제거 */
    function fadeOut(c: Card) {
      c.el.style.opacity = "0";
      c.el.style.pointerEvents = "none";
      after(FADE_MS, () => c.el.remove());
    }

    const slotsOf = (cs: Card[]): Slot[] =>
      cs.map((c) => ({ x: c.homeX, y: c.homeY, reach: c.reach, d2: c.d2 }));

    function build() {
      stage!.querySelectorAll(".float").forEach((f) => f.remove());
      cards = [];
      computeGeom();
      const pool = poolRef.current;
      if (!pool.length) return;
      const n = Math.min(slots, pool.length);
      const placed: Slot[] = [];
      pool.slice(0, n).forEach((p, i) => {
        const { s, cardW } = place(ratioOf(p), placed);
        placed.push(s);
        cards.push(makeCard(p, s, cardW, i * 55));
      });
      // 현재 풀 전체를 "인지함"으로 표시 → 실시간 이펙트가 기존 사진을 다시 합류시키지 않음
      seenRef.current = new Set(pool.map((p) => p.id));
    }

    // 표시 중인 절반을 풀의 다른 사진으로 교체.
    function shuffle() {
      if (!cards.length) return;
      const pool = poolRef.current;
      const shown = new Set(cards.map((c) => c.id));
      const candidates = pool.filter((p) => !shown.has(p.id));
      if (!candidates.length) return; // 새로 보여줄 사진이 없으면 유지
      const k = Math.min(Math.max(1, Math.floor(cards.length / 2)), candidates.length);

      const removing = pickSome(cards, k);
      const removeSet = new Set(removing.map((c) => c.id));
      removing.forEach(fadeOut);
      cards = cards.filter((c) => !removeSet.has(c.id));

      const incoming = pickSome(candidates, k);
      // 빠져나간 자리가 비워진 뒤(페이드아웃 후) 새 사진을 배치해 겹침을 줄인다.
      after(FADE_MS, () => {
        const placed = slotsOf(cards);
        const present = new Set(cards.map((c) => c.id));
        incoming.forEach((p, i) => {
          if (present.has(p.id)) return; // 페이드 중 실시간 합류한 사진과 중복 방지
          const { s, cardW } = place(ratioOf(p), placed);
          placed.push(s);
          cards.push(makeCard(p, s, cardW, i * 70));
        });
      });
    }

    // 새 사진 즉시 합류 — 자리가 있으면 추가, 가득 차면 무작위 1장과 교체.
    function addRealtime(p: Photo) {
      if (!cards.length && !slots) return;
      if (cards.some((c) => c.id === p.id)) return;
      if (cards.length < slots) {
        const placed = slotsOf(cards);
        const { s, cardW } = place(ratioOf(p), placed);
        cards.push(makeCard(p, s, cardW, 0));
      } else {
        const victim = pickSome(cards, 1)[0];
        if (victim) {
          fadeOut(victim);
          cards = cards.filter((c) => c !== victim);
        }
        const placed = slotsOf(cards);
        const { s, cardW } = place(ratioOf(p), placed);
        cards.push(makeCard(p, s, cardW, 60));
      }
    }
    apiRef.current = { addRealtime, shuffle };

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
      timers.forEach(clearTimeout);
      ro.disconnect();
      apiRef.current = null;
    };
  }, [sizeScale, count]);

  // 셔플 타이머 — 주기 변경 시 무대 재구성 없이 타이머만 갱신.
  useEffect(() => {
    const id = window.setInterval(() => apiRef.current?.shuffle(), shuffleMs);
    return () => clearInterval(id);
  }, [shuffleMs]);

  // 새로 등록된 사진을 즉시 무대에 반영 (실시간 우선 노출)
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    for (const p of photos) {
      if (seenRef.current.has(p.id)) continue;
      seenRef.current.add(p.id);
      api.addRealtime(p);
    }
  }, [photos]);

  return <div ref={stageRef} className="stage" />;
}
