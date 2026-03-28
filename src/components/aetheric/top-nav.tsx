import type { RefObject } from "react";
import {
  ChevronDown,
  Disc3,
  Library,
  LogOut,
  Mic2,
  PlayCircle,
  Search,
  Settings,
  Upload,
  User,
} from "lucide-react";

import { NyxIconButton } from "@/components/nyx-ui";

type TopNavProps = {
  appName: string;
  accentText: string;
  textSecondary: string;
  searchSurface: string;
  ghostButton: string;
  navSurface: string;
  menuSurface: string;
  menuHover: string;
  textPrimary: string;
  roleLabel: string;
  uploadStatus: string;
  activeTab: "playing" | "all-tracks" | "albums" | "artists" | "upload";
  onTabChange: (tab: "playing" | "all-tracks" | "albums" | "artists" | "upload") => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  theme: "light" | "dark" | "custom";
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onLogout: () => Promise<void>;
  isProfileOpen: boolean;
  setIsProfileOpen: (next: boolean) => void;
  profileWrapRef: RefObject<HTMLDivElement | null>;
};

export function TopNav({
  appName,
  accentText,
  textSecondary,
  searchSurface,
  ghostButton,
  navSurface,
  menuSurface,
  menuHover,
  textPrimary,
  roleLabel,
  uploadStatus,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  theme,
  onOpenUpload,
  onOpenSettings,
  onLogout,
  isProfileOpen,
  setIsProfileOpen,
  profileWrapRef,
}: TopNavProps) {
  const avatarInitial = roleLabel?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="fixed left-0 top-0 z-40 w-full">
      <nav className={`flex h-20 items-center justify-between px-6 md:px-12 backdrop-blur-xl shadow-[0_20px_40px_rgba(54,82,190,0.06)] ${navSurface}`}>
        <div className="flex items-center gap-8">
          <span className="bg-gradient-to-br from-[#3652be] to-[#839aff] bg-clip-text text-xl font-black text-transparent">
            {appName}
          </span>
          <div className="hidden items-center gap-3 max-[875px]:flex">
            <button
              type="button"
              aria-label="Playing"
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform ${activeTab === "playing" ? `bg-[#3652be]/15 text-[#3652be] scale-110` : "text-slate-300 hover:bg-white/10 scale-100"}`}
              onClick={() => onTabChange("playing")}
            >
              <PlayCircle size={20} />
            </button>
            <button
              type="button"
              aria-label="All Tracks"
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform ${activeTab === "all-tracks" ? `bg-[#3652be]/15 text-[#3652be] scale-110` : "text-slate-300 hover:bg-white/10 scale-100"}`}
              onClick={() => onTabChange("all-tracks")}
            >
              <Library size={20} />
            </button>
            <button
              type="button"
              aria-label="Albums"
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform ${activeTab === "albums" ? `bg-[#3652be]/15 text-[#3652be] scale-110` : "text-slate-300 hover:bg-white/10 scale-100"}`}
              onClick={() => onTabChange("albums")}
            >
              <Disc3 size={20} />
            </button>
            <button
              type="button"
              aria-label="Artists"
              className={`grid h-10 w-10 place-items-center rounded-xl transition-transform ${activeTab === "artists" ? `bg-[#3652be]/15 text-[#3652be] scale-110` : "text-slate-300 hover:bg-white/10 scale-100"}`}
              onClick={() => onTabChange("artists")}
            >
              <Mic2 size={20} />
            </button>
          </div>
          <div className={`hidden items-center gap-8 text-sm ${textSecondary} min-[876px]:flex`}>
            <button
              type="button"
              className={`pb-1 font-semibold transition ${activeTab === "playing" ? `border-b-2 border-[#3652be] ${accentText}` : "hover:text-[#3652be]"}`}
              onClick={() => onTabChange("playing")}
            >
              Playing
            </button>
            <button
              type="button"
              className={`pb-1 transition ${activeTab === "all-tracks" ? `border-b-2 border-[#3652be] ${accentText}` : "hover:text-[#3652be]"}`}
              onClick={() => onTabChange("all-tracks")}
            >
              All Tracks
            </button>
            <button
              type="button"
              className={`pb-1 transition ${activeTab === "albums" ? `border-b-2 border-[#3652be] ${accentText}` : "hover:text-[#3652be]"}`}
              onClick={() => onTabChange("albums")}
            >
              Albums
            </button>
            <button
              type="button"
              className={`pb-1 transition ${activeTab === "artists" ? `border-b-2 border-[#3652be] ${accentText}` : "hover:text-[#3652be]"}`}
              onClick={() => onTabChange("artists")}
            >
              Artists
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="relative hidden min-[640px]:block">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f97aa]" />
            <input
              type="search"
              placeholder="Search your library"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onTabChange("all-tracks");
                }
              }}
              className={`aetheric-search w-56 rounded-full py-2 pl-9 pr-4 text-sm outline-none transition ${searchSurface}`}
            />
          </div>
          <NyxIconButton
            type="button"
            aria-label="Upload music"
            title="Upload music"
            className={ghostButton}
            onClick={onOpenUpload}
          >
            <Upload size={18} />
          </NyxIconButton>
          <div ref={profileWrapRef} className="relative">
            <NyxIconButton
              type="button"
              aria-label="Profile menu"
              title="Profile"
              className="gap-2 rounded-full px-2 py-1"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#3652be] to-[#839aff] text-sm font-semibold text-white shadow-[0_10px_20px_rgba(54,82,190,0.3)]">
                {avatarInitial}
              </span>
              <ChevronDown size={14} />
            </NyxIconButton>
            {isProfileOpen ? (
              <div className={`absolute right-0 mt-3 w-60 rounded-2xl p-3 text-sm shadow-[0_20px_40px_rgba(54,82,190,0.06)] backdrop-blur-[20px] ${menuSurface}`}>
                <div className="grid gap-1">
                  <div className={`mb-1 rounded-xl border border-white/30 p-3 ${theme === "dark" ? "border-slate-700/70 bg-slate-900/40" : "border-white/60 bg-white/70"}`}>
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
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[#c43d3d] ${menuHover}`}
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
