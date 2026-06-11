// ============================================================
// 디스플레이 API — 실시간 피드 (SSE GET /display/feed)
//
// 새 사진 수신과 화면 배치를 분리하기 위해, 이 모듈은 "새 사진이
// 도착했다"는 사실만 콜백으로 전달한다. 노출/배치 정책은 호출측이 정한다.
// ============================================================
import type { Photo } from "../types";
import { USE_MOCK, apiBase } from "./client";
import { mapImage } from "./images";

/**
 * 실시간 피드 구독. 새 사진마다 onPhoto 호출. 반환값은 구독 해제 함수.
 * mock 모드에서는 no-op.
 */
export function subscribeFeed(onPhoto: (photo: Photo) => void): () => void {
  if (USE_MOCK || typeof window === "undefined") return () => {};
  const es = new EventSource(apiBase() + "/display/feed");
  const handler = (e: MessageEvent) => {
    try {
      onPhoto(mapImage(JSON.parse(e.data)));
    } catch {
      /* 파싱 실패 무시 */
    }
  };
  es.addEventListener("image-created", handler as EventListener);
  return () => es.close();
}
