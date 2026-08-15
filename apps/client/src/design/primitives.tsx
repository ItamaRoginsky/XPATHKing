import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="rounded border border-border bg-elevated px-1.5 py-0.5 font-mono text-[11px] text-text-secondary">
      {children}
    </kbd>
  );
}

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Panel({ children, className = "", ...rest }: PanelProps) {
  return (
    <div
      className={`glass rounded-2xl border border-border-subtle shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] ${className}`}
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
  primary:
    "bg-cyan text-void hover:bg-cyan/90 shadow-[0_0_0_1px_rgba(79,216,255,0.4),0_0_24px_rgba(79,216,255,0.25)] font-semibold",
  secondary: "bg-elevated text-text-primary border border-border hover:border-border-strong hover:bg-elevated-2",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-white/5",
  danger: "bg-red/10 text-red border border-red/30 hover:bg-red/20",
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-6 py-3.5 text-base rounded-xl",
};

export function Button({ variant = "secondary", size = "md", className = "", ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    />
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-border-subtle ${className}`} />;
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "cyan" | "amber" | "green" | "red" }) {
  const toneClasses: Record<string, string> = {
    neutral: "bg-white/5 text-text-secondary border-border-subtle",
    cyan: "bg-cyan/10 text-cyan border-cyan/25",
    amber: "bg-amber/10 text-amber border-amber/25",
    green: "bg-green/10 text-green border-green/25",
    red: "bg-red/10 text-red border-red/25",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
