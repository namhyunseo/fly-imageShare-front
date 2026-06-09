// 표시용 시각 포맷 — "오늘 17:07" / "어제 21:30" / "6/8 14:00"
export function relTime(iso: string, nowMs: number): string {
  const d = new Date(iso);
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  const dayMs = 24 * 60 * 60 * 1000;
  const startOf = (ms: number) => {
    const x = new Date(ms);
    x.setHours(0, 0, 0, 0);
    return x.getTime();
  };
  const diffDays = Math.round((startOf(nowMs) - startOf(d.getTime())) / dayMs);
  if (diffDays === 0) return `오늘 ${hm}`;
  if (diffDays === 1) return `어제 ${hm}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${hm}`;
}
