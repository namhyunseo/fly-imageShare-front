"use client";

// 외부 mock 이미지가 깨질 때 fallback으로 자동 교체하는 <img>.
// 실제 Supabase 스토리지 연동 후엔 next/image로 교체 가능.
import { useState } from "react";

export function SmartImg({
  src,
  fallback,
  alt = "",
  className,
  style,
}: {
  src: string;
  fallback?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [cur, setCur] = useState(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={cur}
      alt={alt}
      loading="lazy"
      className={className}
      style={style}
      onError={() => {
        if (fallback && cur !== fallback) setCur(fallback);
      }}
    />
  );
}
