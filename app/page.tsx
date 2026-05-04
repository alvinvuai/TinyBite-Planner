import { FloatingBackground } from "@/components/FloatingBackground";
import { MealPlannerForm } from "@/components/MealPlannerForm";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(160deg,#fff7fb_0%,#fff1df_45%,#f4eeff_100%)] text-[#51354a]">
      <FloatingBackground />
      <MealPlannerForm />
    </main>
  );
}
