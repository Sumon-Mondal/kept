export function TillMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="6" y="7.5" width="20" height="6" rx="1.5" className="stroke-primary-foreground" strokeWidth="1.6" fill="none" />
      <rect x="7" y="16" width="18" height="8.5" rx="1.5" className="fill-primary-foreground" />
      <rect x="13" y="18.7" width="6" height="2" rx="1" className="fill-primary" />
    </svg>
  );
}
