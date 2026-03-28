"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LayoutGrid, List, Search } from "lucide-react";
import { Waveform } from "@/components/aetheric/waveform";
import { UploadForm } from "@/components/upload-form";

import type { SongRow, UserRole } from "@/lib/db/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { TopNav } from "@/components/aetheric/top-nav";
import { PageShell } from "@/components/aetheric/page-shell";
import { NowPlayingPanel } from "@/components/aetheric/now-playing-panel";
import { PlayerFooter } from "@/components/aetheric/player-footer";
import { SettingsModal } from "@/components/aetheric/settings-modal";


type MusicDashboardProps = {
  initialSongs: SongRow[];
  role: UserRole;
  uploadLimit: number | null;
};

type RepeatMode = "off" | "all" | "one";
type ThemeMode = "light" | "dark" | "custom";

type CustomPalette = {
  primary: string;
  text: string;
  surface: string;
  background: string;
};

type PlayerSettings = {
  volume: number;
  shuffle: boolean;
  repeatMode: RepeatMode;
  theme: ThemeMode;
  currentIndex: number;
  customPalette: CustomPalette;
  allTracksView: "grid" | "list";
  lastSongId: string | null;
};

const SETTINGS_KEY = "ymp:player-settings";

function loadSettings(): PlayerSettings {
  if (typeof window === "undefined") {
    return { volume: 0.8, shuffle: false, repeatMode: "off", theme: "light", currentIndex: 0, customPalette: { primary: "#3652be", text: "#2c2f33", surface: "#eef1f6", background: "#f4f6fb" }, allTracksView: "grid", lastSongId: null };
  }

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { volume: 0.8, shuffle: false, repeatMode: "off", theme: "light", currentIndex: 0, customPalette: { primary: "#3652be", text: "#2c2f33", surface: "#eef1f6", background: "#f4f6fb" }, allTracksView: "grid", lastSongId: null };
    }

    const parsed = JSON.parse(raw) as Partial<PlayerSettings>;
    return {
      volume: typeof parsed.volume === "number" ? parsed.volume : 0.8,
      shuffle: typeof parsed.shuffle === "boolean" ? parsed.shuffle : false,
      repeatMode: parsed.repeatMode === "all" || parsed.repeatMode === "one" ? parsed.repeatMode : "off",
      theme: parsed.theme === "dark" || parsed.theme === "custom" ? parsed.theme : "light",
      currentIndex: typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
      lastSongId: typeof parsed.lastSongId === "string" ? parsed.lastSongId : null,
      allTracksView: parsed.allTracksView === "list" ? "list" : "grid",
      customPalette: parsed.customPalette && typeof parsed.customPalette === "object"
        ? {
            primary: typeof parsed.customPalette.primary === "string" ? parsed.customPalette.primary : "#3652be",
            text: typeof parsed.customPalette.text === "string" ? parsed.customPalette.text : "#2c2f33",
            surface: typeof parsed.customPalette.surface === "string" ? parsed.customPalette.surface : "#eef1f6",
            background: typeof parsed.customPalette.background === "string" ? parsed.customPalette.background : "#f4f6fb",
          }
        : { primary: "#3652be", text: "#2c2f33", surface: "#eef1f6", background: "#f4f6fb" },
    };
  } catch {
    return { volume: 0.8, shuffle: false, repeatMode: "off", theme: "light", currentIndex: 0, customPalette: { primary: "#3652be", text: "#2c2f33", surface: "#eef1f6", background: "#f4f6fb" }, allTracksView: "grid", lastSongId: null };
  }
}

function buildPalette(theme: ThemeMode, custom: CustomPalette) {
  if (theme === "custom") {
    const primary = custom.primary || "#3652be";
    const text = custom.text || "#1f2937";
    const surface = custom.surface || "#eef1f6";
    const background = custom.background || "#f4f6fb";
    const textSecondary = `${text}CC`;
    const floatingSurfaceColor = surface;
    const contentSurfaceColor = surface;
    const shadowStrong = "0 18px 42px rgba(0,0,0,0.14)";
    const shadowSoft = "0 10px 26px rgba(0,0,0,0.1)";
    return {
      rootClassName: "min-h-screen text-[inherit] bg-[radial-gradient(circle_at_0%_0%,#f4f6fb_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#dbe2fa_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#fa93e415_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#839aff20_0%,transparent_50%)]",
      backgroundColor: background,
      contentSurface: "bg-transparent",
      contentSurfaceColor,
      floatingSurface: "bg-transparent",
      floatingSurfaceColor,
      trackBase: "bg-white",
      trackActive: `bg-[${primary}1A] text-[${primary}]`,
      textPrimary: `text-[${text}]`,
      textSecondary,
      accentText: `text-[${primary}]`,
      accentHex: primary,
      shadowStrong,
      shadowSoft,
      artworkBg: `${primary}1a`,
      badgeBg: `${primary}1A`,
      badgeText: primary,
      hoverSurface: "hover:bg-[#e8ecf5]",
      searchSurface: "bg-white text-[#4a5165] focus:bg-white",
      navSurface: "bg-white/80 text-[inherit]",
      menuSurface: "bg-white/90 text-[inherit]",
      menuHover: "hover:bg-[#eef1f6]",
      ghostButton: "bg-transparent text-[#4a5165] hover:bg-[#dfe3e9]",
    } as const;
  }

  const isDark = theme === "dark";
  const accentHex = isDark ? "#9ec5ff" : "#2f4fb2";
  const shadowStrong = isDark ? "0 22px 48px rgba(0,0,0,0.38)" : "0 18px 42px rgba(0,0,0,0.12)";
  const shadowSoft = isDark ? "0 12px 30px rgba(0,0,0,0.28)" : "0 10px 26px rgba(0,0,0,0.08)";
  return {
    rootClassName: isDark
      ? "min-h-screen text-slate-100 bg-[#0f1724]"
      : "min-h-screen text-[#2c2f33] bg-[radial-gradient(circle_at_0%_0%,#f4f6fb_0%,transparent_50%),radial-gradient(circle_at_100%_0%,#dbe2fa_0%,transparent_50%),radial-gradient(circle_at_100%_100%,#fa93e415_0%,transparent_50%),radial-gradient(circle_at_0%_100%,#839aff20_0%,transparent_50%)] bg-[#f4f6fb]",
    backgroundColor: isDark ? "#0f1724" : "#f4f6fb",
    contentSurface: "bg-transparent",
    contentSurfaceColor: isDark ? "#111827" : "#eef1f6",
    floatingSurface: "bg-transparent",
    floatingSurfaceColor: isDark ? "#0b1220" : "#ffffff",
    trackBase: isDark ? "bg-[#121b2d]" : "bg-white",
    trackActive: isDark ? "bg-[#1d2a45] text-[#d8e6ff]" : "bg-[#e8edfa] text-[#243b7a]",
    textPrimary: isDark ? "text-slate-100" : "text-[#2c2f33]",
    textSecondary: isDark ? "text-slate-300" : "text-[#4a5165]",
    accentText: isDark ? "text-[#b4d2ff]" : "text-[#2f4fb2]",
    accentHex,
    shadowStrong,
    shadowSoft,
    artworkBg: isDark ? "#1b2437" : "#f5f7fb",
    badgeBg: isDark ? "#1d2a45" : "#e8edfa",
    badgeText: accentHex,
    hoverSurface: isDark ? "hover:bg-slate-700/50" : "hover:bg-[#dfe3e9]",
    searchSurface: isDark
      ? "bg-slate-800/80 text-slate-100 focus:bg-slate-800"
      : "bg-[#eef1f6] text-[#4a5165] focus:bg-white",
    navSurface: isDark ? "bg-slate-900/70 text-slate-100" : "bg-white/70 text-[#2c2f33]",
    menuSurface: isDark ? "bg-slate-800/90 text-slate-100" : "bg-[#d9dde4]/90 text-[#2c2f33]",
    menuHover: isDark ? "hover:bg-slate-700/60" : "hover:bg-white/70",
    ghostButton: isDark
      ? "bg-transparent text-slate-200 hover:bg-slate-700/50"
      : "bg-transparent text-[#4a5165] hover:bg-[#dfe3e9]",
  } as const;
}

export function MusicDashboard({ initialSongs, role, uploadLimit }: MusicDashboardProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Aetheric Music";
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSongIdRef = useRef<string | null>(null);
  const restoringSelectionRef = useRef(false);
  const volumeWrapRef = useRef<HTMLDivElement | null>(null);
  const profileWrapRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredRef = useRef(false);
  const [songs, setSongs] = useState(initialSongs);
  const [selectedSongId, setSelectedSongId] = useState<string | null>(initialSongs[0]?.id ?? null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  const [volume, setVolume] = useState(0.8);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [customPalette, setCustomPalette] = useState<CustomPalette>({ primary: "#3652be", text: "#2c2f33", surface: "#eef1f6", background: "#f4f6fb" });
  const [isAutoplay, setIsAutoplay] = useState(true);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"playing" | "all-tracks" | "upload">("playing");
  const [allTracksView, setAllTracksView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const { roleLabel, uploadsRemaining, uploadStatus } = useMemo(() => {
    const roleLabelValue = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Standard";
    const uploadsRemainingValue = uploadLimit === null ? null : Math.max(uploadLimit - songs.length, 0);

    const uploadStatusValue = uploadLimit === null
      ? `${roleLabelValue} · unlimited uploads`
      : `${uploadsRemainingValue} uploads remaining of ${uploadLimit}`;

    return {
      roleLabel: roleLabelValue,
      uploadsRemaining: uploadsRemainingValue,
      uploadStatus: uploadStatusValue,
    };
  }, [role, songs.length, uploadLimit]);

  const palette = buildPalette(theme, customPalette);
  const {
    rootClassName,
    backgroundColor,
    contentSurface,
    contentSurfaceColor,
    floatingSurface,
    floatingSurfaceColor,
    trackBase,
    textPrimary,
    textSecondary,
    accentText,
    accentHex,
    shadowSoft,
    hoverSurface,
    searchSurface,
    navSurface,
    menuSurface,
    menuHover,
    ghostButton,
  } = palette;

  const currentSong = songs.find((song) => song.id === selectedSongId) ?? null;
  const currentIndex = selectedSongId ? songs.findIndex((song) => song.id === selectedSongId) : -1;

  const filteredSongs = useMemo(
    () =>
      songs.filter((song) =>
        song.title.toLowerCase().includes(searchQuery.trim().toLowerCase()),
      ),
    [songs, searchQuery],
  );

  async function refreshSongs() {
    try {
      const response = await fetch("/api/upload", { method: "GET", cache: "no-store" });
      if (!response.ok) return;
      const payload = (await response.json()) as { songs?: SongRow[] };
      if (!payload?.songs) return;
      setSongs(payload.songs);
      if (payload.songs.length === 0) {
        setSelectedSongId(null);
      } else {
        const stillSelected = payload.songs.some((song) => song.id === selectedSongId);
        if (!stillSelected) {
          setSelectedSongId(payload.songs[0]?.id ?? null);
        }
      }
    } catch {
      // ignore refresh errors
    }
  }

  useEffect(() => {
    if (hasRestoredRef.current) return;
    const settings = loadSettings();
    setVolume(settings.volume);
    setIsShuffle(settings.shuffle);
    setRepeatMode(settings.repeatMode);
    setTheme(settings.theme);
    setCustomPalette(settings.customPalette);
    setAllTracksView(settings.allTracksView);
    if (songs.length > 0) {
      const storedId = settings.lastSongId;
      const hasStored = storedId ? songs.some((song) => song.id === storedId) : false;
      const nextIndex = Math.min(Math.max(settings.currentIndex, 0), songs.length - 1);
      restoringSelectionRef.current = true;
      setSelectedSongId(
        hasStored
          ? storedId
          : songs[nextIndex]?.id ?? songs[0]?.id ?? null,
      );
    }
    hasRestoredRef.current = true;
  }, [songs]);

  useEffect(() => {
    if (!isVolumeOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (volumeWrapRef.current && target && !volumeWrapRef.current.contains(target)) {
        setIsVolumeOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isVolumeOpen]);

  useEffect(() => {
    if (!isProfileOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node | null;
      if (profileWrapRef.current && target && !profileWrapRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      const nextSettings: PlayerSettings = {
        volume,
        shuffle: isShuffle,
        repeatMode,
        theme,
        currentIndex: Math.max(currentIndex, 0),
        lastSongId: selectedSongId,
        customPalette,
        allTracksView,
      };
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    }, 150);

    return () => window.clearTimeout(timer);
  }, [volume, isShuffle, repeatMode, theme, currentIndex, customPalette, allTracksView, selectedSongId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!selectedSongId) {
      audio.pause();
      setIsPlaying(false);
      lastSongIdRef.current = null;
      return;
    }

    // Avoid restarting the currently playing track when the song list refreshes.
    if (lastSongIdRef.current === selectedSongId) {
      return;
    }

    lastSongIdRef.current = selectedSongId;
    audio.src = `/api/stream/${selectedSongId}`;
    const shouldAutoplay = restoringSelectionRef.current ? isAutoplay : true;
    restoringSelectionRef.current = false;

    if (shouldAutoplay) {
      void audio.play().then(
        () => setIsPlaying(true),
        () => setIsPlaying(false),
      );
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [selectedSongId, isAutoplay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleTime() {
      if (!audioRef.current) return;
      setCurrentTime(audioRef.current.currentTime || 0);
    }

    function handleDuration() {
      if (!audioRef.current) return;
      setDuration(Number.isFinite(audioRef.current.duration) ? audioRef.current.duration : 0);
    }

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("durationchange", handleDuration);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("durationchange", handleDuration);
    };
  }, []);

  function formatTime(value: number) {
    if (!Number.isFinite(value)) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function goNext() {
    if (songs.length === 0) return;

    if (isShuffle && songs.length > 1) {
      let nextIndex = currentIndex >= 0 ? currentIndex : 0;
      while (nextIndex === currentIndex) {
        nextIndex = Math.floor(Math.random() * songs.length);
      }
      setSelectedSongId(songs[nextIndex].id);
      return;
    }

    if (currentIndex >= 0 && currentIndex < songs.length - 1) {
      setSelectedSongId(songs[currentIndex + 1].id);
      return;
    }

    if (repeatMode === "all") {
      setSelectedSongId(songs[0].id);
    }
  }

  function goPrevious() {
    if (songs.length === 0) return;

    if (currentIndex > 0) {
      setSelectedSongId(songs[currentIndex - 1].id);
      return;
    }

    if (repeatMode === "all") {
      setSelectedSongId(songs[songs.length - 1].id);
    }
  }

  function toggleRepeatMode() {
    setRepeatMode((mode) => {
      if (mode === "off") return "all";
      if (mode === "all") return "one";
      return "off";
    });
  }

  function seekTo(nextTime: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function togglePlayPause() {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    void audio.play().then(() => setIsPlaying(true));
  }


  return (
    <div className={rootClassName} style={{ backgroundColor }}>
      <TopNav
        appName={appName}
        accentText={accentText}
        textSecondary={textSecondary}
        searchSurface={searchSurface}
        ghostButton={ghostButton}
        navSurface={navSurface}
        menuSurface={menuSurface}
        menuHover={menuHover}
        textPrimary={textPrimary}
        roleLabel={roleLabel}
        uploadStatus={uploadStatus}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === "playing" || tab === "all-tracks" || tab === "upload") {
            setActiveTab(tab);
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        theme={theme}
        onOpenUpload={() => {
          setActiveTab("upload");
          setIsProfileOpen(false);
        }}
        onOpenSettings={() => {
          setIsSettingsOpen(true);
          setIsProfileOpen(false);
        }}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.assign("/login");
        }}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        profileWrapRef={profileWrapRef}
      />

      <div className={activeTab === "playing" ? "block" : "hidden"}>
        <PageShell
          textSecondary={textSecondary}
          contentSurface={contentSurface}
          contentSurfaceColor={contentSurfaceColor}
        >
          <NowPlayingPanel
            song={currentSong}
            textSecondary={textSecondary}
            textPrimary={textPrimary}
            accentText={accentText}
            hoverSurface={hoverSurface}
          />
        </PageShell>
      </div>

      <div className={activeTab === "all-tracks" ? "block" : "hidden"}>
        <div className="px-6 pb-32 pt-28 md:px-12 md:pt-32">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-sm ${textSecondary}`}>Your library</p>
              <h1 className="font-manrope text-[clamp(1.8rem,3vw,2.6rem)] font-semibold">All Tracks</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${hoverSurface}`}
                style={allTracksView === "grid" ? { boxShadow: shadowSoft, color: accentHex, borderColor: accentHex + "33" } : undefined}
                onClick={() => setAllTracksView("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-sm transition ${hoverSurface}`}
                style={allTracksView === "list" ? { boxShadow: shadowSoft, color: accentHex, borderColor: accentHex + "33" } : undefined}
                onClick={() => setAllTracksView("list")}
                aria-label="List view"
              >
                <List size={16} />
              </button>
              <span className={`ml-2 text-sm ${textSecondary}`}>{filteredSongs.length} tracks</span>
            </div>
          </div>
          <div className="mb-4 block sm:hidden">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f97aa]" />
              <input
                type="search"
                placeholder="Search your library"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    setActiveTab("all-tracks");
                  }
                }}
                className={`w-full rounded-full py-2 pl-10 pr-4 text-sm outline-none transition ${searchSurface}`}
              />
            </div>
          </div>
          {songs.length === 0 ? (
            <div className={`rounded-2xl border border-dashed p-6 text-sm ${textSecondary}`}>No tracks yet</div>
          ) : allTracksView === "grid" ? (
            <div
              className="scroll-hide grid max-h-[calc(100vh-360px)] grid-cols-1 gap-4 overflow-y-auto pr-1 pb-24 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            >
              {filteredSongs.map((song) => {
                const cover = song.cover_path ? `/api/cover/${song.id}` : "/cd_np.svg";
                const isActive = song.id === selectedSongId;
                return (
                  <button
                    key={song.id}
                    type="button"
                    className={`group flex flex-col gap-3 rounded-2xl border border-transparent p-3 text-left transition ${trackBase} ${hoverSurface}`}
                    style={isActive ? { boxShadow: shadowSoft, color: accentHex, borderColor: `${accentHex}55` } : undefined}
                    onClick={() => setSelectedSongId(song.id)}
                  >
                    <div className="relative overflow-hidden rounded-xl shadow-[0_14px_32px_rgba(0,0,0,0.12)]">
                      <Image
                        src={cover}
                        alt={song.title}
                        width={320}
                        height={320}
                        unoptimized={Boolean(song.cover_path)}
                        className="aspect-square w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold" title={song.title}>
                        {song.title}
                      </p>
                      <p className={`text-xs ${textSecondary}`}>Tap to play</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="scroll-hide flex max-h-[calc(100vh-360px)] flex-col gap-3 overflow-y-auto pr-1 pb-24">
              {filteredSongs.map((song) => {
                const cover = song.cover_path ? `/api/cover/${song.id}` : "/cd_np.svg";
                const isActive = song.id === selectedSongId;
                return (
                  <button
                    key={song.id}
                    type="button"
                    className={`group flex items-center gap-4 rounded-2xl border border-transparent px-3 py-2 text-left transition ${trackBase} ${hoverSurface}`}
                    style={isActive ? { boxShadow: shadowSoft, color: accentHex, borderColor: `${accentHex}55` } : undefined}
                    onClick={() => setSelectedSongId(song.id)}
                  >
                    <div className="relative h-16 w-16 overflow-hidden rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.12)]">
                      <Image
                        src={cover}
                        alt={song.title}
                        width={80}
                        height={80}
                        unoptimized={Boolean(song.cover_path)}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold" title={song.title}>
                        {song.title}
                      </p>
                      <p className={`truncate text-xs ${textSecondary}`}>Tap to play</p>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center" aria-label={isActive ? "Now playing" : undefined}>
                      {isActive ? <Waveform color={accentHex} /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className={activeTab === "upload" ? "block" : "hidden"}>
        <div className="px-6 pb-32 pt-28 md:px-12 md:pt-32">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className={`text-sm ${textSecondary}`}>Upload center</p>
              <h1 className="font-manrope text-[clamp(1.8rem,3vw,2.6rem)] font-semibold">Upload Music</h1>
              <p className={`text-sm ${textSecondary}`}>
                {uploadsRemaining === null
                  ? "Unlimited uploads"
                  : `${uploadsRemaining} uploads remaining${uploadLimit ? ` of ${uploadLimit}` : ""}.`}
              </p>
            </div>
          </div>
          <div className={`rounded-3xl border border-dashed p-6 md:p-8 ${contentSurface}`} style={{ backgroundColor: contentSurfaceColor }}>
            <UploadForm onUploaded={refreshSongs} uploadLimit={uploadLimit} uploadsRemaining={uploadsRemaining} />
          </div>
        </div>
      </div>

      <PlayerFooter
        floatingSurface={floatingSurface}
        floatingSurfaceColor={floatingSurfaceColor}
        textSecondary={textSecondary}
        ghostButton={ghostButton}
        accentHex={accentHex}
        canPlay={Boolean(currentSong)}
        isPlaying={isPlaying}
        duration={duration}
        currentTime={currentTime}
        volume={volume}
        currentSong={currentSong}
        isVolumeOpen={isVolumeOpen}
        setIsVolumeOpen={setIsVolumeOpen}
        onSeek={seekTo}
        onTogglePlay={togglePlayPause}
        onNext={goNext}
        onPrevious={goPrevious}
        onToggleShuffle={() => setIsShuffle((current) => !current)}
        onToggleRepeat={toggleRepeatMode}
        isShuffle={isShuffle}
        onVolumeChange={setVolume}
        formatTime={formatTime}
        volumeWrapRef={volumeWrapRef}
        repeatMode={repeatMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={(mode) => setTheme(mode)}
        customPalette={customPalette}
        onCustomPaletteChange={setCustomPalette}
        isAutoplay={isAutoplay}
        onToggleAutoplay={() => setIsAutoplay((current) => !current)}
        surfaceColor={floatingSurfaceColor}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        accentHex={accentHex}
      />

      <audio
        ref={audioRef}
        preload="metadata"
        onEnded={() => {
          if (!isAutoplay) return;
          if (repeatMode === "one") {
            const audio = audioRef.current;
            if (audio) {
              audio.currentTime = 0;
              void audio.play();
            }
            return;
          }

          goNext();
        }}
      />

      <style jsx global>{`
        .tracks-scroll,
        .scroll-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .tracks-scroll::-webkit-scrollbar,
        .scroll-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
