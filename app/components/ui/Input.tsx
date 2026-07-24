import { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Input({ label, id, className = "", ...props }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        className={`bg-surface border border-line rounded-md px-4 py-3 text-[16px] text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft/60 transition-all duration-150 ${className}`}
        {...props}
      />
    </div>
  );
}

export const selectClassName =
  "bg-surface border border-line rounded-md px-4 py-3 text-[16px] text-ink focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent-soft/60 transition-all duration-150";
