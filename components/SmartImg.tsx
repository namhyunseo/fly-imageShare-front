// 이미지 표시용 <img> 래퍼 (lazy 로딩).
// 백엔드 실연동 후 next/image로 교체 예정(#5).

export function SmartImg({
  src,
  alt = "",
  className,
  style,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading="lazy" className={className} style={style} />
  );
}
