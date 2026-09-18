/**
 * The Atlas mark: contour rings crossed by a meridian — a plate from an
 * anatomical atlas and a map at once.
 */
export function AtlasMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="none">
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.6" opacity="0.28" />
      <ellipse cx="16" cy="16" rx="6.2" ry="13" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 16h26" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.6 9.4h20.8M5.6 22.6h20.8" stroke="currentColor" strokeWidth="1.3" opacity="0.5" />
      <circle cx="16" cy="16" r="2.3" fill="currentColor" />
    </svg>
  );
}
