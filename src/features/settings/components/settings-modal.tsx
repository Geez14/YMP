import type { ChangeEvent } from "react";
import { PlayCircle, Power, RotateCcw, X } from "lucide-react";

import { UiIconButton, UiToggle } from "@/components/ui/ui-controls";
import { DEFAULT_CUSTOM_PALETTE } from "@/features/settings/lib/settings-storage";
import type {
  DashboardCustomPalette,
  ThemeMode,
} from "@/features/settings/types/settings-ui.types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  customPalette: DashboardCustomPalette;
  onCustomPaletteChange: (next: DashboardCustomPalette) => void;
  isAutoplay: boolean;
  onToggleAutoplay: () => void;
  surfaceColor: string;
  textPrimaryColor: string;
  textSecondaryColor: string;
  accentHex: string;
  shadowSoft: string;
  successTextColor: string;
  dangerTextColor: string;
  modalOverlayColor: string;
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
  textPrimaryColor,
  textSecondaryColor,
  accentHex,
  shadowSoft,
  successTextColor,
  dangerTextColor,
  modalOverlayColor,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const autoplayLabel = isAutoplay ? "Autoplay On" : "Autoplay Off";
  const autoplaySurfaceColor = `${textSecondaryColor}1F`;
  const autoplayBorderColor = `${textSecondaryColor}4D`;
  const resetButtonBorderColor = `${textSecondaryColor}4D`;
  const onPaletteColorChange =
    (key: keyof DashboardCustomPalette) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      onCustomPaletteChange({
        ...customPalette,
        [key]: event.target.value,
      });
    };

  function resetCustomTheme() {
    onCustomPaletteChange({ ...DEFAULT_CUSTOM_PALETTE });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center backdrop-blur-[20px]" style={{ backgroundColor: modalOverlayColor }}>
      <div
        className="w-[min(92vw,520px)] rounded-[32px] p-6"
        style={{ backgroundColor: surfaceColor, color: textPrimaryColor, boxShadow: shadowSoft }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-manrope text-xl font-semibold">Settings</h3>
            <p className="text-sm" style={{ color: textSecondaryColor }}>Personalize your listening.</p>
          </div>
          <UiIconButton type="button" aria-label="Close settings" onClick={onClose}>
            <X size={16} />
          </UiIconButton>
        </div>

        <div className="mt-6 grid gap-3">
          <div className="grid gap-2 rounded-2xl p-3" style={{ backgroundColor: `${surfaceColor}cc` }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold" style={{ color: textPrimaryColor }}>Theme</p>
              {theme === "custom" ? (
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition hover:brightness-105"
                  style={{ color: textSecondaryColor, border: `1px solid ${resetButtonBorderColor}` }}
                  onClick={resetCustomTheme}
                >
                  <RotateCcw size={12} style={{ color: accentHex }} />
                  Default
                </button>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "dark", "custom"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    theme === mode ? "" : "border-transparent"
                  }`}
                  style={theme === mode ? { borderColor: accentHex, color: accentHex } : { color: textSecondaryColor }}
                  onClick={() => onThemeChange(mode)}
                >
                  {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "Custom"}
                </button>
              ))}
            </div>
            {theme === "custom" ? (
              <div className="grid grid-cols-2 gap-3 pt-2 text-sm" style={{ color: textPrimaryColor }}>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Primary</span>
                  <input
                    type="color"
                    value={customPalette.primary}
                    onChange={onPaletteColorChange("primary")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Text</span>
                  <input
                    type="color"
                    value={customPalette.text}
                    onChange={onPaletteColorChange("text")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Text Secondary</span>
                  <input
                    type="color"
                    value={customPalette.textSecondary}
                    onChange={onPaletteColorChange("textSecondary")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Surface</span>
                  <input
                    type="color"
                    value={customPalette.surface}
                    onChange={onPaletteColorChange("surface")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Background</span>
                  <input
                    type="color"
                    value={customPalette.background}
                    onChange={onPaletteColorChange("background")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Success</span>
                  <input
                    type="color"
                    value={customPalette.success}
                    onChange={onPaletteColorChange("success")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Danger</span>
                  <input
                    type="color"
                    value={customPalette.danger}
                    onChange={onPaletteColorChange("danger")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs" style={{ color: textSecondaryColor }}>Overlay</span>
                  <input
                    type="color"
                    value={customPalette.overlay}
                    onChange={onPaletteColorChange("overlay")}
                    className="h-10 w-full rounded-lg border"
                    style={{ borderColor: `${textSecondaryColor}55` }}
                  />
                </label>
              </div>
            ) : null}
          </div>

          <UiToggle
            type="button"
            className="flex items-center justify-between rounded-2xl px-4 py-3 hover:brightness-105"
            style={{ backgroundColor: autoplaySurfaceColor, border: `1px solid ${autoplayBorderColor}` }}
            onClick={onToggleAutoplay}
          >
            <span className="flex items-center gap-3 text-sm font-semibold" style={{ color: textPrimaryColor }}>
              {isAutoplay
                ? <PlayCircle size={18} style={{ color: successTextColor }} />
                : <Power size={18} style={{ color: dangerTextColor }} />}
              {autoplayLabel}
            </span>
            <span className="text-xs" style={{ color: textSecondaryColor }}>Auto-advance to next track</span>
          </UiToggle>
        </div>
      </div>
    </div>
  );
}
