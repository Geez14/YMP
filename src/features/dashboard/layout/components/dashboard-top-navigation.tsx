import type { RefObject } from "react";
import {
  Library,
  LogOut,
  PlayCircle,
  Settings,
  Upload,
  User,
} from "lucide-react";

import { UiIconButton } from "@/components/ui/ui-controls";
import type { DashboardTab, ThemeMode } from "@/features/settings/types/settings-ui.types";

type DashboardTopNavigationProps = {
  appName: string;
  accentText: string;
  accentHex: string;
  textSecondary: string;
  ghostButton: string;
  navSurface: string;
  menuSurface: string;
  menuHover: string;
  shadowSoft: string;
  textPrimary: string;
  roleLabel: string;
  uploadStatus: string;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  theme: ThemeMode;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onLogout: () => Promise<void>;
  isProfileOpen: boolean;
  setIsProfileOpen: (next: boolean) => void;
  profileWrapRef: RefObject<HTMLDivElement | null>;
};

export function DashboardTopNavigation({
  appName,
  accentText,
  accentHex,
  textSecondary,
  ghostButton,
  navSurface,
  menuSurface,
  menuHover,
  shadowSoft,
  textPrimary,
  roleLabel,
  uploadStatus,
  activeTab,
  onTabChange,
  theme,
  onOpenUpload,
  onOpenSettings,
  onLogout,
  isProfileOpen,
  setIsProfileOpen,
  profileWrapRef,
}: DashboardTopNavigationProps) {
  const avatarInitial = roleLabel?.[0]?.toUpperCase() ?? "U";
  const activeTabStyle = { backgroundColor: `${accentHex}26`, color: accentHex };
  const appNameStyle = { color: accentHex };
  const avatarStyle = { backgroundColor: accentHex, boxShadow: shadowSoft };
  const profileMenuStyle = { boxShadow: shadowSoft };
  const profileCardStyle = { borderColor: `${accentHex}33`, backgroundColor: `${accentHex}12` };

  return (
    <header className="fixed left-0 top-0 z-40 w-full">
      <nav className={`flex h-20 items-center justify-between px-6 md:px-12 backdrop-blur-xl ${navSurface}`} style={{ boxShadow: shadowSoft }}>
        <div className="flex items-center gap-8">
          <span className="text-xl font-black" style={appNameStyle}>
            {appName}
          </span>
          <div className="hidden items-center gap-3 max-[875px]:flex">
            <button
              type="button"
              aria-label="Playing"
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform ${activeTab === "playing" ? "scale-110" : `${textSecondary} ${menuHover} scale-100`}`}
              style={activeTab === "playing" ? activeTabStyle : undefined}
              onClick={() => onTabChange("playing")}
            >
              <PlayCircle size={20} />
            </button>
            <button
              type="button"
              aria-label="All Tracks"
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform ${activeTab === "all-tracks" ? "scale-110" : `${textSecondary} ${menuHover} scale-100`}`}
              style={activeTab === "all-tracks" ? activeTabStyle : undefined}
              onClick={() => onTabChange("all-tracks")}
            >
              <Library size={20} />
            </button>
          </div>
          <div className={`hidden items-center gap-8 text-sm ${textSecondary} min-[876px]:flex`}>
            <button
              type="button"
              className={`pb-1 font-semibold transition ${activeTab === "playing" ? `border-b-2 ${accentText}` : textSecondary}`}
              style={activeTab === "playing" ? { borderColor: accentHex } : undefined}
              onClick={() => onTabChange("playing")}
            >
              Playing
            </button>
            <button
              type="button"
              className={`pb-1 transition ${activeTab === "all-tracks" ? `border-b-2 ${accentText}` : textSecondary}`}
              style={activeTab === "all-tracks" ? { borderColor: accentHex } : undefined}
              onClick={() => onTabChange("all-tracks")}
            >
              All Tracks
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <UiIconButton
            type="button"
            aria-label="Upload music"
            title="Upload music"
            className={ghostButton}
            onClick={onOpenUpload}
          >
            <Upload size={18} />
          </UiIconButton>
          <div ref={profileWrapRef} className="relative">
            <button
              type="button"
              aria-label="Profile menu"
              title="Profile"
              className="grid h-10 w-10 place-items-center rounded-full"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full text-sm font-semibold text-white" style={avatarStyle}>
                {avatarInitial}
              </span>
            </button>
            {isProfileOpen ? (
              <div className={`absolute right-0 mt-3 w-60 rounded-2xl p-3 text-sm backdrop-blur-[20px] ${menuSurface}`} style={profileMenuStyle}>
                <div className="grid gap-1">
                  <div className="mb-1 rounded-xl border p-3" style={profileCardStyle}>
                    <p className="text-sm font-semibold">{roleLabel}</p>
                    <p className={`text-xs ${textSecondary}`}>{uploadStatus}</p>
                  </div>
                  <button type="button" className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left ${textPrimary} ${menuHover}`}>
                    <User size={16} /> Profile
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left ${textPrimary} ${menuHover}`}
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenSettings();
                    }}
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <button
                    type="button"
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left ${textPrimary} ${menuHover}`}
                    onClick={onLogout}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </nav>
    </header>
  );
}
