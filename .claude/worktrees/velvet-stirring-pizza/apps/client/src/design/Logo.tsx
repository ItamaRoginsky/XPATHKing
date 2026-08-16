export function Logo({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-5xl sm:text-6xl" : size === "md" ? "text-2xl" : "text-lg";
  const markSize = size === "lg" ? 44 : size === "md" ? 30 : 22;
  const gap = size === "lg" ? "gap-4" : "gap-2.5";

  return (
    <div className={`flex items-center ${gap}`}>
      <svg width={markSize} height={markSize} viewBox="0 0 32 32" className="shrink-0">
        <rect width="32" height="32" rx="9" fill="var(--color-accent-strong)" />
        <path
          d="M10.5 9.5 L21.5 22.5 M21.5 9.5 L10.5 22.5"
          stroke="var(--color-ink-inverse)"
          strokeWidth="2.3"
          strokeLinecap="round"
        />
        <line x1="8.5" y1="16" x2="23.5" y2="16" stroke="var(--color-gold)" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      </svg>
      <span className={`${textSize} font-display font-medium tracking-tight text-ink`}>
        XPATH <span className="italic text-accent">King</span>
      </span>
    </div>
  );
}
