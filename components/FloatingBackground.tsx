const floaties = [
  { label: "heart", icon: "♥", className: "left-[8%] top-[9%] text-[#ff94bc] delay-0" },
  { label: "star", icon: "✦", className: "right-[10%] top-[12%] text-[#d8b7ff] delay-200" },
  { label: "rice ball", icon: "◒", className: "left-[18%] top-[35%] text-[#ffd88f] delay-500" },
  { label: "fruit", icon: "●", className: "right-[12%] top-[46%] text-[#ff9aa7] delay-700" },
  { label: "milk bottle", icon: "▱", className: "left-[7%] bottom-[22%] text-[#cbb6ff] delay-1000" },
  { label: "bubble", icon: "○", className: "right-[20%] bottom-[16%] text-[#ffffff] delay-300" },
];

export function FloatingBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgba(255,255,255,0.92),transparent_22%),radial-gradient(circle_at_78%_30%,rgba(255,211,226,0.58),transparent_25%),radial-gradient(circle_at_50%_85%,rgba(230,218,255,0.62),transparent_26%)]" />
      {floaties.map((item) => (
        <span
          key={item.label}
          className={`absolute text-4xl opacity-55 blur-[0.1px] [animation:float-soft_7s_ease-in-out_infinite] ${item.className}`}
        >
          {item.icon}
        </span>
      ))}
      <style>{`
        @keyframes float-soft {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-4deg); }
          50% { transform: translate3d(0, -18px, 0) rotate(6deg); }
        }
      `}</style>
    </div>
  );
}
