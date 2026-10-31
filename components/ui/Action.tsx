import type { ButtonHTMLAttributes } from "react";

type ActionVariant = "botanic" | "lip" | "quiet";

const variantClasses: Record<ActionVariant, string> = {
  botanic:
    "bg-botanic text-paper border border-botanic hover:bg-botanic-hover hover:border-botanic-hover",
  lip: "bg-lip-deep text-paper border border-lip-deep hover:bg-lip-deep-hover hover:border-lip-deep-hover",
  quiet:
    "bg-transparent text-ink border border-line hover:border-ink hover:bg-paper-deep",
};

interface ActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ActionVariant;
}

export function Action({
  variant = "botanic",
  className = "",
  type = "button",
  ...props
}: ActionProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-[2px] px-6 py-3 text-[0.95rem] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
