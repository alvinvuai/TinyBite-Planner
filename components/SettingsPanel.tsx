"use client";

import type { ChildProfile } from "@/types/meal";
import { CuteButton } from "@/components/CuteButton";

type SettingsPanelProps = {
  open: boolean;
  profile: ChildProfile;
  onOpenChange: (open: boolean) => void;
  onChange: (profile: ChildProfile) => void;
};

const goals = ["Weight gain", "Protein exposure", "Reduce fruit/milk rescue pattern"];
const safeFoods = ["Rice", "Yoghurt", "Banana", "Egg", "Cheese", "Bread", "Avocado"];
const fruits = ["Mandarin", "Grape", "Kiwi", "Plum", "Dried plum / prune", "Pear", "Banana"];

export function SettingsPanel({ open, profile, onOpenChange, onChange }: SettingsPanelProps) {
  if (!open) return null;

  function toggleList(key: "avoidFoods" | "goals" | "acceptedSafeFoods" | "fruitOptions", value: string) {
    const current = profile[key];
    onChange({ ...profile, [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  }

  return (
    <div className="fixed inset-0 z-40" aria-hidden={!open}>
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0 bg-[#51354a]/18 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <aside
        className="absolute bottom-0 left-0 right-0 max-h-[86vh] overflow-y-auto rounded-t-[8px] bg-[#fff8fb] p-5 shadow-[0_-18px_50px_rgba(90,53,70,0.22)]"
      >
        <div className="mx-auto max-w-xl space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-[#633d55]">Toddler settings</h2>
              <p className="text-sm font-medium text-[#8a6679]">Stored privately in this browser.</p>
            </div>
            <CuteButton type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Done
            </CuteButton>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm font-bold">
              Age months
              <input
                type="number"
                step="0.5"
                value={profile.ageMonths}
                onChange={(event) => onChange({ ...profile, ageMonths: Number(event.target.value) })}
                className="min-h-12 w-full rounded-[8px] border border-[#f6cbdb] bg-white px-3"
              />
            </label>
            <label className="space-y-1 text-sm font-bold">
              Weight kg
              <input
                type="number"
                step="0.1"
                value={profile.weightKg}
                onChange={(event) => onChange({ ...profile, weightKg: Number(event.target.value) })}
                className="min-h-12 w-full rounded-[8px] border border-[#f6cbdb] bg-white px-3"
              />
            </label>
          </div>

          <label className="flex items-center justify-between rounded-[8px] bg-white/72 p-4 text-sm font-bold">
            Finger foods preferred
            <input
              type="checkbox"
              checked={profile.fingerFoodPreferred}
              onChange={(event) => onChange({ ...profile, fingerFoodPreferred: event.target.checked })}
              className="h-6 w-6 accent-[#ff7eb6]"
            />
          </label>

          <div className="space-y-2">
            <p className="text-sm font-black">Avoid foods</p>
            <div className="flex gap-2">
              {["noodles", "congee"].map((food) => (
                <button
                  type="button"
                  key={food}
                  onClick={() => toggleList("avoidFoods", food)}
                  className={`rounded-full px-4 py-2 text-sm font-bold ${profile.avoidFoods.includes(food) ? "bg-[#ffe0ec] text-[#8c3d61]" : "bg-white text-[#765066]"}`}
                >
                  {food}
                </button>
              ))}
            </div>
          </div>

          <ChipGroup title="Goals" items={goals} active={profile.goals} onToggle={(item) => toggleList("goals", item.toLowerCase())} />
          <ChipGroup title="Accepted safe foods" items={safeFoods} active={profile.acceptedSafeFoods} onToggle={(item) => toggleList("acceptedSafeFoods", item)} />
          <ChipGroup title="Fruit list" items={fruits} active={profile.fruitOptions} onToggle={(item) => toggleList("fruitOptions", item)} />
        </div>
      </aside>
    </div>
  );
}

function ChipGroup({ title, items, active, onToggle }: { title: string; items: string[]; active: string[]; onToggle: (item: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-black">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onToggle(item)}
            className={`rounded-full px-3.5 py-2 text-sm font-bold ${active.some((value) => value.toLowerCase() === item.toLowerCase()) ? "bg-[#ffe0ec] text-[#8c3d61]" : "bg-white text-[#765066]"}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
