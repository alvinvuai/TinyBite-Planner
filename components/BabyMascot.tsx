type BabyMascotProps = {
  isLoading?: boolean;
};

export function BabyMascot({ isLoading = false }: BabyMascotProps) {
  return (
    <div className={`relative mx-auto h-36 w-36 ${isLoading ? "animate-[baby-bounce_1.4s_ease-in-out_infinite]" : ""}`}>
      <svg viewBox="0 0 180 180" role="img" aria-label="Smiling baby girl mascot" className="h-full w-full drop-shadow-[0_18px_20px_rgba(184,105,139,0.18)]">
        <defs>
          <linearGradient id="bonnet" x1="0" x2="1">
            <stop offset="0" stopColor="#ff95c0" />
            <stop offset="1" stopColor="#ffd2a6" />
          </linearGradient>
          <linearGradient id="skin" x1="0" x2="1">
            <stop offset="0" stopColor="#ffe0cc" />
            <stop offset="1" stopColor="#ffd4c2" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="88" r="66" fill="url(#bonnet)" />
        <path d="M35 97c12-32 30-50 55-50s43 18 55 50c-9 33-28 50-55 50s-46-17-55-50Z" fill="#fff5fb" />
        <circle cx="90" cy="96" r="45" fill="url(#skin)" />
        <path d="M53 61c7-19 20-31 37-31s30 12 37 31c-11-7-23-11-37-11S64 54 53 61Z" fill="#7b4a58" opacity=".28" />
        <circle cx="71" cy="95" r="4.5" fill="#5a3546" className="origin-center animate-[blink_4.5s_infinite]" />
        <circle cx="109" cy="95" r="4.5" fill="#5a3546" className="origin-center animate-[blink_4.5s_infinite]" />
        <circle cx="60" cy="107" r="7" fill="#ff94a8" opacity=".45" />
        <circle cx="120" cy="107" r="7" fill="#ff94a8" opacity=".45" />
        <path d="M76 114c8 8 20 8 28 0" fill="none" stroke="#9e516a" strokeLinecap="round" strokeWidth="4" />
        <path d="M132 115c17 2 25 12 22 22-2 7-8 11-14 9" fill="none" stroke="#ffd4c2" strokeLinecap="round" strokeWidth="13" className="origin-[132px_115px] animate-[wave_1.8s_ease-in-out_infinite]" />
        <path d="M50 154c19 12 61 12 80 0" stroke="#ff87ba" strokeLinecap="round" strokeWidth="10" />
        <path d="M34 46l8 9 12-16" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" opacity=".88" />
        <circle cx="138" cy="45" r="6" fill="#fff5a8" className="animate-[twinkle_1.6s_ease-in-out_infinite]" />
        <path d="M145 24l3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Z" fill="#fff5a8" className="animate-[twinkle_1.9s_ease-in-out_infinite]" />
      </svg>
      <style>{`
        @keyframes blink {
          0%, 93%, 100% { transform: scaleY(1); }
          96% { transform: scaleY(0.1); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-12deg); }
        }
        @keyframes twinkle {
          0%, 100% { transform: scale(1); opacity: .72; }
          50% { transform: scale(1.22); opacity: 1; }
        }
        @keyframes baby-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
