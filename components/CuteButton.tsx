import type { ButtonHTMLAttributes, ReactNode } from "react";

type CuteButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

const variants = {
  primary: "border border-[#d86f9f] bg-[#f3a3c4] text-[#4c2340] shadow-[0_12px_26px_rgba(190,78,126,0.22)]",
  secondary: "border border-[#e7ccd9] bg-[#fffafd] text-[#5e3752] shadow-[0_10px_22px_rgba(126,70,101,0.10)]",
  ghost: "border border-[#ead8e2] bg-[#fffafd] text-[#5e3752] shadow-sm",
  danger: "border border-[#efd09a] bg-[#fff0d0] text-[#704315] shadow-[0_10px_22px_rgba(184,122,45,0.12)]",
};

export function CuteButton({ children, variant = "primary", className = "", ...props }: CuteButtonProps) {
  return (
    <button
      className={`cute-button pressable min-h-12 rounded-full px-5 py-3 text-sm font-black ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
