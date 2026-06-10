// ============================================================
// 코멘트 모더레이션 (클라이언트 1차 필터)
//
// 업로드 화면 안내문("비속어·부적절 단어는 자동 필터링됩니다")과
// 실제 동작을 일치시키기 위한 최소 금칙어 검사. 가벼운 1차 방어이며,
// 연동 후에는 서버 측 필터링이 최종 판단(이중 적용 여부는 #5에서 확인).
// ============================================================

// 최소 예시 금칙어. 운영 시 별도 목록/서버 규칙으로 관리.
const BANNED = ["시발", "씨발", "병신", "ㅅㅂ", "ㅂㅅ", "좆", "fuck", "shit"];

/** 정규화: 공백 제거 + 소문자 (단순 우회 방지) */
function normalize(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** 코멘트가 금칙어를 포함하면 true */
export function hasProfanity(comment: string): boolean {
  const n = normalize(comment);
  return BANNED.some((w) => n.includes(normalize(w)));
}
