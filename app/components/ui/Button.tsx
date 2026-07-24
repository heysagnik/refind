import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "success" | "dark" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const styles: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_1px_2px_rgba(37,99,235,0.25)]",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-bg active:scale-[0.98]",
  ghost: "text-ink-soft hover:bg-bg active:scale-[0.98]",
  success: "bg-success text-white hover:opacity-90 active:scale-[0.98]",
  dark: "bg-ink text-white hover:opacity-90 active:scale-[0.98]",
  danger: "bg-danger text-white hover:opacity-90 active:scale-[0.98]",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-pill px-6 py-3 text-[15px] font-semibold min-h-[48px] transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${styles[variant]} ${className}`}
      {...props}
    />
  );
}
