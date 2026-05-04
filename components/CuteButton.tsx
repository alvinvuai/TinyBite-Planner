import type { ButtonHTMLAttributes, ReactNode } from "react";

type CuteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary:
    "bg-[linear-gradient(135deg,#ff86b7,#ffb36f)] text-white shadow-[0_12px_28px_rgba(255,111,159,0.34)]",
  secondary: "bg-white/78 text-[#734761] shadow-[0_10px_25px_rgba(184,105,139,0.12)]",
  ghost: "bg-white/42 text-[#734761]",
  danger: "bg-[#fff0d7] text-[#7a4a20] shadow-[0_10px_25px_rgba(222,162,89,0.14)]",
};

export function CuteButton({ children, variant = "primary", className = "", ...props }: CuteButtonProps) {
  return (
    <button
      className={`pressable min-h-12 rounded-full px-5 py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
