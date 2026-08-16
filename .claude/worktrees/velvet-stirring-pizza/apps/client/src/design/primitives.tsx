import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded-md border border-line-strong bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-ink-secondary shadow-[0_1px_0_rgba(38,35,25,0.08)]">
      {children}
    </kbd>
  );
}

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Panel({ children, className = "", hover = false, ...rest }: PanelProps) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-card ${hover ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent text-ink-inverse hover:bg-accent-strong font-medium shadow-[0_1px_2px_rgba(38,35,25,0.12)]",
  secondary: "bg-surface text-ink border border-line-strong hover:border-accent/50 hover:bg-accent-soft/50 font-medium",
  ghost: "text-ink-secondary hover:text-ink hover:bg-surface-muted font-medium",
  danger: "bg-error-soft text-error border border-error/25 hover:bg-error/15 font-medium",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3.5 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3.5 text-base rounded-xl",
};

export function Button({ variant = "secondary", size = "md", className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-line ${className}`} />;
}

type Tone = "neutral" | "accent" | "sage" | "sand" | "lavender" | "rose" | "gold" | "success" | "warning" | "error";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-surface-muted text-ink-secondary border-line",
  accent: "bg-accent-soft text-accent-strong border-accent/20",
  sage: "bg-sage-soft text-sage border-sage/20",
  sand: "bg-sand-soft text-sand border-sand/20",
  lavender: "bg-lavender-soft text-lavender border-lavender/20",
  rose: "bg-rose-soft text-rose border-rose/20",
  gold: "bg-gold-soft text-gold border-gold/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  error: "bg-error-soft text-error border-error/20",
};

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {children}
    </span>
  );
}

/** Small rounded container that tints an icon with a muted pastel background. */
export function IconTile({
  children,
  tone = "accent",
  size = "md",
  shape = "square",
}: {
  children: ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  shape?: "square" | "circle";
}) {
  const sizeClasses = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" }[size];
  const shapeClasses = shape === "circle" ? "rounded-full" : "rounded-xl";
  const toneClasses = TONE_CLASSES[tone].split(" ").slice(0, 2).join(" ");
  return (
    <div className={`flex shrink-0 items-center justify-center ${sizeClasses} ${shapeClasses} ${toneClasses}`}>{children}</div>
  );
}

export function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-tertiary focus:border-accent focus:ring-2 focus:ring-accent/15 ${className}`}
      {...rest}
    />
  );
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <label className={`mb-1.5 block text-xs font-medium text-ink-secondary ${className}`}>{children}</label>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`text-xs font-semibold uppercase tracking-[0.08em] text-ink-tertiary ${className}`}>{children}</div>
  );
}

export function ProgressBar({ value, tone = "accent", className = "" }: { value: number; tone?: Tone; className?: string }) {
  const barToneClasses: Record<Tone, string> = {
    neutral: "bg-ink-tertiary",
    accent: "bg-accent",
    sage: "bg-sage",
    sand: "bg-sand",
    lavender: "bg-lavender",
    rose: "bg-rose",
    gold: "bg-gold",
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
  };
  return (
    <div className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-300 ${barToneClasses[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
