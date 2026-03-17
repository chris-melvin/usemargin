"use client";

import { useRouter } from "next/navigation";
import { Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { LockedOverlay } from "@/components/subscription/upgrade-prompt";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  type CardTheme,
  type BackgroundStyle,
  type GlareStyle,
  type CardMaterial,
  type CardPreferences,
  THEME_PRESETS,
  PRO_THEMES,
} from "./card-theme";

type ThemeKey = Exclude<CardTheme, "auto">;

const FREE_THEMES: ThemeKey[] = ["emerald", "ocean", "sunset", "lavender", "slate", "rose"];

const THEME_OPTIONS: { value: CardTheme; label: string; swatch?: string; pro?: boolean }[] = [
  { value: "auto", label: "Auto" },
  ...FREE_THEMES.map((key) => ({
    value: key as CardTheme,
    label: THEME_PRESETS[key].label,
    swatch: THEME_PRESETS[key].swatch,
  })),
  ...(PRO_THEMES as ThemeKey[]).map((key) => ({
    value: key as CardTheme,
    label: THEME_PRESETS[key].label,
    swatch: THEME_PRESETS[key].swatch,
    pro: true,
  })),
];

const FREE_BG_OPTIONS: { value: BackgroundStyle; label: string; description: string }[] = [
  { value: "mesh", label: "Mesh", description: "Fluid gradient" },
  { value: "grain", label: "Grain", description: "Film texture" },
  { value: "static", label: "Static", description: "No animation" },
];

const PRO_BG_OPTIONS: { value: BackgroundStyle; label: string; description: string }[] = [
  { value: "neuro", label: "Neural", description: "Organic web" },
  { value: "metaballs", label: "Liquid", description: "Gooey blobs" },
  { value: "godrays", label: "Radiance", description: "Light rays" },
  { value: "swirl", label: "Vortex", description: "Spiral bands" },
  { value: "waves", label: "Waves", description: "Layered lines" },
];

const MATERIAL_OPTIONS: { value: CardMaterial; label: string; description: string; pro?: boolean }[] = [
  { value: "default", label: "Default", description: "Clean" },
  { value: "glass", label: "Glass", description: "Frosted blur", pro: true },
  { value: "metallic", label: "Metallic", description: "Chrome sheen", pro: true },
  { value: "holo", label: "Holo", description: "Rainbow refraction", pro: true },
];

interface CardCustomizeSheetProps {
  prefs: Required<CardPreferences>;
  onUpdate: <K extends keyof CardPreferences>(key: K, value: CardPreferences[K]) => void;
  isPro: boolean;
  dark?: boolean;
}

export function CardCustomizeSheet({ prefs, onUpdate, isPro, dark }: CardCustomizeSheetProps) {
  const router = useRouter();
  const goToPricing = () => router.push("/pricing");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className={cn(
            "absolute bottom-3 right-3 z-10",
            "flex items-center gap-1 px-2 py-1 rounded-full",
            "text-[10px] font-medium",
            "opacity-0 group-hover/hero:opacity-100 focus:opacity-100",
            "transition-opacity duration-200",
            dark
              ? "bg-white/10 backdrop-blur-sm border border-white/20 text-white/60 hover:bg-white/20 hover:text-white/80"
              : "bg-white/60 backdrop-blur-sm border border-stone-200/60 text-neutral-500 hover:bg-white/80 hover:text-neutral-700"
          )}
        >
          <Palette className="w-3 h-3" />
          Customize
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Card</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Theme */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Theme
            </h4>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((option) => {
                const isLocked = option.pro && !isPro;
                return (
                  <button
                    key={option.value}
                    onClick={() => isLocked ? goToPricing() : onUpdate("theme", option.value)}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all",
                      prefs.theme === option.value
                        ? "border-neutral-900 bg-neutral-50 font-medium"
                        : "border-neutral-200 hover:border-neutral-300",
                      isLocked && "opacity-60"
                    )}
                  >
                    {option.swatch ? (
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10"
                        style={{ backgroundColor: option.swatch }}
                      />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-300 via-amber-200 to-rose-300 border border-black/10" />
                    )}
                    {option.label}
                    {isLocked && (
                      <LockedOverlay className="rounded-xl" />
                    )}
                  </button>
                );
              })}
            </div>
            {prefs.theme === "auto" && (
              <p className="text-[11px] text-neutral-400 mt-2">Changes with your budget status</p>
            )}
          </section>

          {/* Background Style */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Background
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {FREE_BG_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onUpdate("backgroundStyle", option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all",
                    prefs.backgroundStyle === option.value
                      ? "border-neutral-900 bg-neutral-50"
                      : "border-neutral-200 hover:border-neutral-300"
                  )}
                >
                  <span className="font-medium text-xs">{option.label}</span>
                  <span className="text-[10px] text-neutral-400">{option.description}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {PRO_BG_OPTIONS.map((option) => {
                const isLocked = !isPro;
                return (
                  <button
                    key={option.value}
                    onClick={() => isLocked ? goToPricing() : onUpdate("backgroundStyle", option.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-sm transition-all",
                      prefs.backgroundStyle === option.value
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-300",
                      isLocked && "opacity-60"
                    )}
                  >
                    <span className="font-medium text-xs">{option.label}</span>
                    <span className="text-[10px] text-neutral-400">{option.description}</span>
                    {isLocked && (
                      <LockedOverlay className="rounded-xl" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Surface / Material */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Surface
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {MATERIAL_OPTIONS.map((option) => {
                const isLocked = option.pro && !isPro;
                return (
                  <button
                    key={option.value}
                    onClick={() => isLocked ? goToPricing() : onUpdate("material", option.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-sm transition-all",
                      prefs.material === option.value
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-300",
                      isLocked && "opacity-60"
                    )}
                  >
                    <span className="font-medium text-xs">{option.label}</span>
                    <span className="text-[10px] text-neutral-400">{option.description}</span>
                    {isLocked && (
                      <LockedOverlay className="rounded-xl" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Display Name */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Your Name
            </h4>
            <input
              type="text"
              value={prefs.displayName}
              onChange={(e) => onUpdate("displayName", e.target.value)}
              placeholder="Enter your name for a greeting"
              className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-300"
              maxLength={30}
            />
            {prefs.displayName && (
              <p className="text-[11px] text-neutral-400 mt-1.5">
                You&apos;ll see a personalized greeting on your card
              </p>
            )}
          </section>

          {/* Effects */}
          <section>
            <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
              Effects
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">3D Tilt</span>
                <Switch
                  checked={prefs.enableTilt}
                  onCheckedChange={(v: boolean) => onUpdate("enableTilt", v)}
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-neutral-700">Glare Effect</span>
                <Switch
                  checked={prefs.enableGlare}
                  onCheckedChange={(v: boolean) => onUpdate("enableGlare", v)}
                />
              </label>
              {prefs.enableGlare && (
                <div className="flex gap-2 pl-1">
                  {(["standard", "holographic", "prismatic"] as GlareStyle[]).map((style) => {
                    const isLocked = style === "prismatic" && !isPro;
                    return (
                      <button
                        key={style}
                        onClick={() => isLocked ? goToPricing() : onUpdate("glareStyle", style)}
                        className={cn(
                          "relative px-3 py-1.5 rounded-lg border text-xs capitalize transition-all",
                          prefs.glareStyle === style
                            ? "border-neutral-900 bg-neutral-50 font-medium"
                            : "border-neutral-200 hover:border-neutral-300",
                          isLocked && "opacity-60"
                        )}
                      >
                        {style}
                        {isLocked && (
                          <LockedOverlay className="rounded-lg" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
