export function Logo({ size = "lg" }: { size?: "sm" | "md" | "lg" }) {
  const textSize = size === "lg" ? "text-5xl sm:text-6xl" : size === "md" ? "text-2xl" : "text-lg";
  const iconSize = size === "lg" ? 40 : size === "md" ? 24 : 18;

  return (
    <div className="flex items-center gap-3">
      <svg width={iconSize} height={iconSize} viewBox="0 0 32 32" className="shrink-0">
        <circle cx="16" cy="16" r="9" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan" />
        <circle cx="16" cy="16" r="2.5" fill="currentColor" className="text-cyan" />
        <path d="M16 3v5M16 24v5M3 16h5M24 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cyan" />
      </svg>
      <span className={`${textSize} font-bold tracking-tight`}>
        <span className="text-text-primary">XPATH</span> <span className="text-cyan text-glow-cyan">ARENA</span>
      </span>
    </div>
  );
}
