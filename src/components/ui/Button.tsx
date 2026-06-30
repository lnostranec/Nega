import { clsx } from "clsx";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center font-medium transition duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        {
          "bg-brand text-white btn-site btn-site-filled": variant === "primary",
          "border border-stone-300 bg-stone-100 text-stone-900 btn-site": variant === "secondary",
          "border border-stone-300 bg-transparent text-stone-900 btn-site": variant === "outline",
          "px-4 py-2 text-sm": size === "sm",
          "px-6 py-3 text-sm uppercase tracking-widest": size === "md",
          "px-8 py-4 text-base": size === "lg",
        },
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
