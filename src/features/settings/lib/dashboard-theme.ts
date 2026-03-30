import type {
  DashboardCustomPalette,
  ThemeMode,
} from "@/features/settings/types/settings-ui.types";

type DashboardPalette = {
  rootClassName: string;
  backgroundColor: string;
  contentSurface: string;
  contentSurfaceColor: string;
  floatingSurface: string;
  floatingSurfaceColor: string;
  trackBase: string;
  trackActive: string;
  textPrimary: string;
  textPrimaryColor: string;
  textSecondary: string;
  textSecondaryColor: string;
  accentText: string;
  accentHex: string;
  shadowStrong: string;
  shadowSoft: string;
  artworkBg: string;
  badgeBg: string;
  badgeText: string;
  hoverSurface: string;
  searchSurface: string;
  navSurface: string;
  menuSurface: string;
  menuHover: string;
  ghostButton: string;
  searchIconColor: string;
  iconMutedColor: string;
  menuBorderColor: string;
  dangerTextColor: string;
  dangerSurfaceColor: string;
  successTextColor: string;
  modalOverlayColor: string;
  coverFallbackFrom: string;
  coverFallbackTo: string;
  coverFallbackTextColor: string;
};

type StaticThemeTokens = {
  rootClassName: string;
  backgroundColor: string;
  contentSurfaceColor: string;
  floatingSurfaceColor: string;
  trackBase: string;
  trackActive: string;
  textPrimary: string;
  textPrimaryColor: string;
  textSecondary: string;
  textSecondaryColor: string;
  accentText: string;
  accentHex: string;
  shadowStrong: string;
  shadowSoft: string;
  artworkBg: string;
  badgeBg: string;
  hoverSurface: string;
  searchSurface: string;
  navSurface: string;
  menuSurface: string;
  menuHover: string;
  ghostButton: string;
  searchIconColor: string;
  iconMutedColor: string;
  menuBorderColor: string;
  dangerTextColor: string;
  dangerSurfaceColor: string;
  successTextColor: string;
  modalOverlayColor: string;
  coverFallbackFrom: string;
  coverFallbackTo: string;
  coverFallbackTextColor: string;
};

const CUSTOM_FALLBACK = {
  primary: "#3652be",
  text: "#1f2937",
  textSecondary: "#4a5165",
  surface: "#eef1f6",
  background: "#f4f6fb",
  success: "#2bbd66",
  danger: "#c43d3d",
  overlay: "#000000",
};

const LIGHT_THEME_TOKENS: StaticThemeTokens = {
  rootClassName:
    "min-h-screen text-[#2c2f33] bg-[radial-gradient(circle_at_0%_0%,#f4f6fb_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#dbe2fa_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#fa93e415_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#839aff20_0%,transparent_50%)] bg-[#f4f6fb]",
  backgroundColor: "#f4f6fb",
  contentSurfaceColor: "#eef1f6",
  floatingSurfaceColor: "#ffffff",
  trackBase: "bg-white",
  trackActive: "bg-[#e8edfa] text-[#243b7a]",
  textPrimary: "text-[#2c2f33]",
  textPrimaryColor: "#2c2f33",
  textSecondary: "text-[#4a5165]",
  textSecondaryColor: "#4a5165",
  accentText: "text-[#2f4fb2]",
  accentHex: "#2f4fb2",
  shadowStrong: "0 18px 42px rgba(0,0,0,0.12)",
  shadowSoft: "0 10px 26px rgba(0,0,0,0.08)",
  artworkBg: "#f5f7fb",
  badgeBg: "#e8edfa",
  hoverSurface: "hover:bg-[#dfe3e9]",
  searchSurface: "bg-[#eef1f6] text-[#4a5165] focus:bg-white",
  navSurface: "bg-white/70 text-[#2c2f33]",
  menuSurface: "bg-[#d9dde4]/90 text-[#2c2f33]",
  menuHover: "hover:bg-white/70",
  ghostButton: "bg-transparent text-[#4a5165] hover:bg-[#dfe3e9]",
  searchIconColor: "#8f97aa",
  iconMutedColor: "#4a5165",
  menuBorderColor: "#cfd5df",
  dangerTextColor: "#c43d3d",
  dangerSurfaceColor: "#c43d3d15",
  successTextColor: "#2bbd66",
  modalOverlayColor: "rgba(0,0,0,0.3)",
  coverFallbackFrom: "#cbd5e1",
  coverFallbackTo: "#64748b",
  coverFallbackTextColor: "#0f172a",
};

const DARK_THEME_TOKENS: StaticThemeTokens = {
  rootClassName: "min-h-screen text-slate-100 bg-[#0f1724]",
  backgroundColor: "#0f1724",
  contentSurfaceColor: "#111827",
  floatingSurfaceColor: "#0b1220",
  trackBase: "bg-[#121b2d]",
  trackActive: "bg-[#1d2a45] text-[#d8e6ff]",
  textPrimary: "text-slate-100",
  textPrimaryColor: "#e2e8f0",
  textSecondary: "text-slate-300",
  textSecondaryColor: "#cbd5e1",
  accentText: "text-[#b4d2ff]",
  accentHex: "#9ec5ff",
  shadowStrong: "0 22px 48px rgba(0,0,0,0.38)",
  shadowSoft: "0 12px 30px rgba(0,0,0,0.28)",
  artworkBg: "#1b2437",
  badgeBg: "#1d2a45",
  hoverSurface: "hover:bg-slate-700/50",
  searchSurface: "bg-slate-800/80 text-slate-100 focus:bg-slate-800",
  navSurface: "bg-slate-900/70 text-slate-100",
  menuSurface: "bg-slate-800/90 text-slate-100",
  menuHover: "hover:bg-slate-700/60",
  ghostButton: "bg-transparent text-slate-200 hover:bg-slate-700/50",
  searchIconColor: "#9ca3af",
  iconMutedColor: "#cbd5e1",
  menuBorderColor: "#334155",
  dangerTextColor: "#f87171",
  dangerSurfaceColor: "#7f1d1d33",
  successTextColor: "#4ade80",
  modalOverlayColor: "rgba(2,6,23,0.5)",
  coverFallbackFrom: "#334155",
  coverFallbackTo: "#0f172a",
  coverFallbackTextColor: "#f1f5f9",
};

export function buildDashboardPalette(
  theme: ThemeMode,
  custom: DashboardCustomPalette,
): DashboardPalette {
  if (theme === "custom") {
    const primary = custom.primary || CUSTOM_FALLBACK.primary;
    const text = custom.text || CUSTOM_FALLBACK.text;
    const textSecondary = custom.textSecondary || CUSTOM_FALLBACK.textSecondary;
    const surface = custom.surface || CUSTOM_FALLBACK.surface;
    const background = custom.background || CUSTOM_FALLBACK.background;
    const success = custom.success || CUSTOM_FALLBACK.success;
    const danger = custom.danger || CUSTOM_FALLBACK.danger;
    const overlay = custom.overlay || CUSTOM_FALLBACK.overlay;

    return {
      rootClassName:
        "min-h-screen text-[inherit] bg-[radial-gradient(circle_at_0%_0%,var(--ymp-bg,#f4f6fb)_0%,transparent_50%),radial-gradient(circle_at_100%_0%,var(--ymp-surface,#eef1f6)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,var(--ymp-accent-soft,#3652be1A)_0%,transparent_50%),radial-gradient(circle_at_0%_100%,var(--ymp-accent-soft-2,#3652be12)_0%,transparent_50%)]",
      backgroundColor: background,
      contentSurface: "bg-transparent",
      contentSurfaceColor: surface,
      floatingSurface: "bg-transparent",
      floatingSurfaceColor: surface,
      trackBase: "bg-white",
      trackActive: `bg-[${primary}1A] text-[${primary}]`,
      textPrimary: "text-[color:var(--ymp-text-primary)]",
      textPrimaryColor: text,
      textSecondary: "text-[color:var(--ymp-text-secondary)]",
      textSecondaryColor: textSecondary,
      accentText: "text-[color:var(--ymp-accent)]",
      accentHex: primary,
      shadowStrong: "0 18px 42px rgba(0,0,0,0.14)",
      shadowSoft: "0 10px 26px rgba(0,0,0,0.1)",
      artworkBg: `${primary}1a`,
      badgeBg: `${primary}1A`,
      badgeText: primary,
      hoverSurface: "hover:bg-[#e8ecf5]",
      searchSurface: "bg-white text-[color:var(--ymp-text-secondary)] focus:bg-white",
      navSurface: "bg-white/80 text-[inherit]",
      menuSurface: "bg-white/90 text-[inherit]",
      menuHover: "hover:bg-[color:var(--ymp-surface)]",
      ghostButton: "bg-transparent text-[color:var(--ymp-text-secondary)] hover:bg-[color:var(--ymp-surface)]",
      searchIconColor: textSecondary,
      iconMutedColor: textSecondary,
      menuBorderColor: `${textSecondary}55`,
      dangerTextColor: danger,
      dangerSurfaceColor: `${danger}1A`,
      successTextColor: success,
      modalOverlayColor: `${overlay}4D`,
      coverFallbackFrom: surface,
      coverFallbackTo: primary,
      coverFallbackTextColor: text,
    };
  }

  const tokens = theme === "dark" ? DARK_THEME_TOKENS : LIGHT_THEME_TOKENS;

  return {
    rootClassName: tokens.rootClassName,
    backgroundColor: tokens.backgroundColor,
    contentSurface: "bg-transparent",
    contentSurfaceColor: tokens.contentSurfaceColor,
    floatingSurface: "bg-transparent",
    floatingSurfaceColor: tokens.floatingSurfaceColor,
    trackBase: tokens.trackBase,
    trackActive: tokens.trackActive,
    textPrimary: tokens.textPrimary,
    textPrimaryColor: tokens.textPrimaryColor,
    textSecondary: tokens.textSecondary,
    textSecondaryColor: tokens.textSecondaryColor,
    accentText: tokens.accentText,
    accentHex: tokens.accentHex,
    shadowStrong: tokens.shadowStrong,
    shadowSoft: tokens.shadowSoft,
    artworkBg: tokens.artworkBg,
    badgeBg: tokens.badgeBg,
    badgeText: tokens.accentHex,
    hoverSurface: tokens.hoverSurface,
    searchSurface: tokens.searchSurface,
    navSurface: tokens.navSurface,
    menuSurface: tokens.menuSurface,
    menuHover: tokens.menuHover,
    ghostButton: tokens.ghostButton,
    searchIconColor: tokens.searchIconColor,
    iconMutedColor: tokens.iconMutedColor,
    menuBorderColor: tokens.menuBorderColor,
    dangerTextColor: tokens.dangerTextColor,
    dangerSurfaceColor: tokens.dangerSurfaceColor,
    successTextColor: tokens.successTextColor,
    modalOverlayColor: tokens.modalOverlayColor,
    coverFallbackFrom: tokens.coverFallbackFrom,
    coverFallbackTo: tokens.coverFallbackTo,
    coverFallbackTextColor: tokens.coverFallbackTextColor,
  };
}
