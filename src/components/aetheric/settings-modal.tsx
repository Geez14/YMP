import { PlayCircle, Power, X } from "lucide-react";

import { NyxIconButton, NyxToggle } from "@/components/nyx-ui";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: "light" | "dark" | "custom";
  onThemeChange: (mode: "light" | "dark" | "custom") => void;
  customPalette: { primary: string; text: string; surface: string; background: string };
  onCustomPaletteChange: (next: { primary: string; text: string; surface: string; background: string }) => void;
  isAutoplay: boolean;
  onToggleAutoplay: () => void;
  surfaceColor: string;
  textPrimary: string;
  textSecondary: string;
  accentHex: string;
};

export function SettingsModal({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  customPalette,
  onCustomPaletteChange,
  isAutoplay,
  onToggleAutoplay,
  surfaceColor,
  textPrimary,
  textSecondary,
  accentHex,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const autoplayLabel = isAutoplay ? "Autoplay On" : "Autoplay Off";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 backdrop-blur-[20px]">
      <div
        className="w-[min(92vw,520px)] rounded-[32px] p-6 shadow-[0_20px_40px_rgba(54,82,190,0.12)]"
        style={{ backgroundColor: surfaceColor, color: textPrimary }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-manrope text-xl font-semibold">Settings</h3>
            <p className="text-sm" style={{ color: textSecondary }}>Personalize your listening.</p>
          </div>
          <NyxIconButton type="button" aria-label="Close settings" onClick={onClose}>
            <X size={16} />
          </NyxIconButton>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="grid gap-2 rounded-2xl p-3" style={{ backgroundColor: `${surfaceColor}cc` }}>
            <p className="text-xs font-semibold" style={{ color: textPrimary }}>Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    theme === mode ? "" : "border-transparent"
                  }`}
                  style={theme === mode ? { borderColor: accentHex, color: accentHex } : { color: textSecondary }}
                  onClick={() => onThemeChange(mode)}
                >
                  {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "Custom"}
                </button>
              ))}
            </div>
            {theme === "custom" ? (
              <div className="grid grid-cols-2 gap-3 pt-2 text-sm" style={{ color: textPrimary }}>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondary }}>Primary</span>
                  <input
                    type="color"
                    value={customPalette.primary}
                    onChange={(e) => onCustomPaletteChange({ ...customPalette, primary: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#d7dce8]"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondary }}>Text</span>
                  <input
                    type="color"
                    value={customPalette.text}
                    onChange={(e) => onCustomPaletteChange({ ...customPalette, text: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#d7dce8]"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondary }}>Surface</span>
                  <input
                    type="color"
                    value={customPalette.surface}
                    onChange={(e) => onCustomPaletteChange({ ...customPalette, surface: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#d7dce8]"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondary }}>Background</span>
                  <input
                    type="color"
                    value={customPalette.background}
                    onChange={(e) => onCustomPaletteChange({ ...customPalette, background: e.target.value })}
                    className="h-10 w-full rounded-lg border border-[#d7dce8]"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <NyxToggle type="button" className="flex items-center justify-between rounded-2xl px-4 py-3" onClick={onToggleAutoplay}>
            <span className="flex items-center gap-3 text-sm font-semibold" style={{ color: textPrimary }}>
              {isAutoplay ? <PlayCircle size={18} className="text-[#2bbd66]" /> : <Power size={18} className="text-[#c43d3d]" />}
              {autoplayLabel}
            </span>
            <span className="text-xs" style={{ color: textSecondary }}>Auto-advance to next track</span>
          </NyxToggle>
        </div>
      </div>
    </div>
  );
}
