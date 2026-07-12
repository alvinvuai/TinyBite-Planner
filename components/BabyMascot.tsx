import Image from "next/image";

type BabyMascotProps = {
  isLoading?: boolean;
};

export function BabyMascot({ isLoading = false }: BabyMascotProps) {
  return (
    <div className={`relative mx-auto h-36 w-36 ${isLoading ? "animate-[baby-bounce_1.4s_ease-in-out_infinite]" : ""}`}>
      <Image
        src="/logo.png"
        alt="Dưa Béo logo"
        fill
        priority
        sizes="144px"
        className="object-contain drop-shadow-[0_18px_20px_rgba(184,105,139,0.18)]"
      />
      <style>{`
        @keyframes baby-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
}
