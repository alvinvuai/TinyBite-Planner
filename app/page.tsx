import { FloatingBackground } from "@/components/FloatingBackground";
import { MealPlannerForm } from "@/components/MealPlannerForm";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(160deg,#fff9fc_0%,#fff0e2_48%,#f3ecff_100%)] text-[#47243d]">
      <FloatingBackground />
      <MealPlannerForm />
    </main>
  );
}
