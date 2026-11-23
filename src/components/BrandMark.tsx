export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="1.25" />
      <ellipse cx="20" cy="20" rx="18" ry="6" transform="rotate(-40 20 20)" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="31.6" cy="8.2" r="2" fill="currentColor" />
    </svg>
  );
}
