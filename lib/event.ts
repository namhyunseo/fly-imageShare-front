// ============================================================
// 행사 진행일(day) 도메인
//
// 사진은 "어느 소속이 올렸는가(affiliation)"와 "행사 며칠차인가(day)"
// 두 축으로 다뤄진다. day 경계는 자정이 아니라 익일 03:00을 기준으로
// 넘긴다 — 늦은 밤에 올라온 사진도 같은 하루의 흐름으로 묶기 위함.
//
// DAY_STARTS는 dev/mock 기본값이며, 백엔드 연동 시 서버 기준 값으로
// 교체한다(프론트는 선택된 day를 전달하고, 검증·저장은 백엔드가 맡음).
// ============================================================

/** 행사 진행일 */
export type Day = "PRE" | "DAY1" | "DAY2" | "DAY3";

/** UI 노출 순서 (PRE → DAY3) */
export const DAYS: Day[] = ["PRE", "DAY1", "DAY2", "DAY3"];

/** 탭/칩에 쓰는 짧은 라벨 */
export const DAY_LABEL: Record<Day, string> = {
  PRE: "PRE",
  DAY1: "DAY1",
  DAY2: "DAY2",
  DAY3: "DAY3",
};

// day 시작 경계(03:00 기준). 문서 예시: 7/3 = DAY1.
//   7/3 23:40 → DAY1   (DAY2 시작 전)
//   7/4 02:20 → DAY1   (아직 03:00 전)
//   7/4 03:05 → DAY2
const DAY_STARTS: { day: Day; start: number }[] = [
  { day: "DAY1", start: Date.parse("2026-07-03T03:00:00+09:00") },
  { day: "DAY2", start: Date.parse("2026-07-04T03:00:00+09:00") },
  { day: "DAY3", start: Date.parse("2026-07-05T03:00:00+09:00") },
];

/** 주어진 시각이 속한 행사 day. 첫 경계 이전은 PRE. */
export function dayOf(ms: number): Day {
  let cur: Day = "PRE";
  for (const b of DAY_STARTS) if (ms >= b.start) cur = b.day;
  return cur;
}

/** 업로드 화면 진입 시 기본 선택할 day (현재 시각 기준) */
export function currentDay(): Day {
  return dayOf(Date.now());
}
