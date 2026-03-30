"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { CSSProperties } from "react";

import { DashboardTopNavigation } from "@/features/dashboard/layout/components/dashboard-top-navigation";
import { useDashboardSession } from "@/features/dashboard/hooks/use-dashboard-session";
import { AllTracksTabPanel } from "@/features/library/components/all-tracks-tab-panel";
import { UploadTabPanel } from "@/features/library/components/upload-tab-panel";
import { PlayerFooter } from "@/features/player/components/player-footer";
import { PlayerErrorBoundary } from "@/features/player/components/player-error-boundary";
import { PlayingTabPanel } from "@/features/player/components/playing-tab-panel";
import { SettingsModal } from "@/features/settings/components/settings-modal";
import { buildDashboardPalette } from "@/features/settings/lib/dashboard-theme";
import { SettingsContext } from "@/features/settings/context/settings-context";
import { useLibrary } from "@/features/library/hooks/use-library";
import { usePlayer } from "@/features/player/hooks/use-player";
import { useSettings } from "@/features/settings/hooks/use-settings";
import type { DashboardTab } from "@/features/settings/types/settings-ui.types";
import type { DashboardWorkspaceProps } from "@/features/dashboard/workspace/dashboard-workspace.types";

export function DashboardWorkspace({ initialSongs, role, uploadLimit }: DashboardWorkspaceProps) {
  const { logout } = useDashboardSession();
  const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Aetheric Music";

  const [selectedSongId, setSelectedSongId] = useState<string | null>(initialSongs[0]?.id ?? null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>("playing");
  const [isTabPending, startTabTransition] = useTransition();

  const volumeWrapRef = useRef<HTMLDivElement | null>(null);
  const profileWrapRef = useRef<HTMLDivElement | null>(null);

  const settings = useSettings({ songs: initialSongs, selectedSongId });

  const library = useLibrary({
    initialSongs,
    allTracksView: settings.allTracksView,
    setAllTracksView: settings.setAllTracksView,
  });

  useEffect(() => {
    if (library.songs.length === 0) {
      setSelectedSongId(null);
      return;
    }

    if (!selectedSongId || !library.songs.some((song) => song.id === selectedSongId)) {
      setSelectedSongId(library.songs[0].id);
    }
  }, [library.songs, selectedSongId]);

  const settingsContextValue = useMemo(
    () => ({
      volume: settings.volume,
      setVolume: settings.setVolume,
      isShuffle: settings.isShuffle,
      setIsShuffle: settings.setIsShuffle,
      repeatMode: settings.repeatMode,
      setRepeatMode: settings.setRepeatMode,
      theme: settings.theme,
      setTheme: settings.setTheme,
      customPalette: settings.customPalette,
      setCustomPalette: settings.setCustomPalette,
      isAutoplay: settings.isAutoplay,
      setIsAutoplay: settings.setIsAutoplay,
      allTracksView: settings.allTracksView,
      setAllTracksView: settings.setAllTracksView,
    }),
    [settings],
  );

  const player = usePlayer({
    songs: library.songs,
    selectedSongId,
    setSelectedSongId,
    restoredSongId: settings.restoredSongId,
    restoredCurrentIndex: settings.restoredCurrentIndex,
    hasRestored: settings.hasRestored,
    volume: settings.volume,
    isShuffle: settings.isShuffle,
    setIsShuffle: settings.setIsShuffle,
    repeatMode: settings.repeatMode,
    setRepeatMode: settings.setRepeatMode,
    isAutoplay: settings.isAutoplay,
  });

  const { roleLabel, uploadsRemaining, uploadStatus } = useMemo(() => {
    const roleLabelValue = role ? `${role.charAt(0).toUpperCase()}${role.slice(1)}` : "Standard";
    const uploadsRemainingValue = uploadLimit === null ? null : Math.max(uploadLimit - library.songs.length, 0);

    const uploadStatusValue = uploadLimit === null
      ? `${roleLabelValue} · unlimited uploads`
      : `${uploadsRemainingValue} uploads remaining of ${uploadLimit}`;

    return {
      roleLabel: roleLabelValue,
      uploadsRemaining: uploadsRemainingValue,
      uploadStatus: uploadStatusValue,
    };
  }, [role, library.songs.length, uploadLimit]);

  const palette = buildDashboardPalette(settings.theme, settings.customPalette);
  const {
    rootClassName,
    backgroundColor,
    contentSurface,
    contentSurfaceColor,
    floatingSurface,
    floatingSurfaceColor,
    trackBase,
    textPrimary,
    textPrimaryColor,
    textSecondary,
    textSecondaryColor,
    accentText,
    accentHex,
    shadowSoft,
    hoverSurface,
    searchSurface,
    navSurface,
    menuSurface,
    menuHover,
    ghostButton,
    searchIconColor,
    iconMutedColor,
    menuBorderColor,
    dangerTextColor,
    dangerSurfaceColor,
    successTextColor,
    modalOverlayColor,
    coverFallbackFrom,
    coverFallbackTo,
    coverFallbackTextColor,
  } = palette;

  const rootStyle: CSSProperties = {
    backgroundColor,
    ["--ymp-text-primary" as string]: settings.customPalette.text,
    ["--ymp-text-secondary" as string]: settings.customPalette.textSecondary,
    ["--ymp-accent" as string]: settings.customPalette.primary,
    ["--ymp-bg" as string]: settings.customPalette.background,
    ["--ymp-surface" as string]: settings.customPalette.surface,
    ["--ymp-accent-soft" as string]: `${settings.customPalette.primary}1A`,
    ["--ymp-accent-soft-2" as string]: `${settings.customPalette.primary}12`,
    ["--ymp-cover-fallback-from" as string]: coverFallbackFrom,
    ["--ymp-cover-fallback-to" as string]: coverFallbackTo,
    ["--ymp-cover-fallback-text" as string]: coverFallbackTextColor,
  };

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

  const handleTabChange = useCallback((tab: DashboardTab) => {
    startTabTransition(() => setActiveTab(tab));
  }, [startTabTransition]);

  const handleOpenUpload = useCallback(() => {
    startTabTransition(() => setActiveTab("upload"));
    setIsProfileOpen(false);
  }, [startTabTransition]);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
    setIsProfileOpen(false);
  }, []);

  const handleSearchEnter = useCallback(() => {
    startTabTransition(() => setActiveTab("all-tracks"));
  }, [startTabTransition]);

  const handleToggleAutoplay = useCallback(() => {
    settings.setIsAutoplay(!settings.isAutoplay);
  }, [settings]);

  return (
    <SettingsContext.Provider value={settingsContextValue}>
      <div className={rootClassName} style={rootStyle}>
        <DashboardTopNavigation
          appName={appName}
          accentText={accentText}
          accentHex={accentHex}
          textSecondary={textSecondary}
          ghostButton={ghostButton}
          navSurface={navSurface}
          menuSurface={menuSurface}
          menuHover={menuHover}
          shadowSoft={shadowSoft}
          textPrimary={textPrimary}
          roleLabel={roleLabel}
          uploadStatus={uploadStatus}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          theme={settings.theme}
          onOpenUpload={handleOpenUpload}
          onOpenSettings={handleOpenSettings}
          onLogout={logout}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          profileWrapRef={profileWrapRef}
        />

        <div className={activeTab === "playing" ? "block" : "hidden"} aria-busy={isTabPending ? "true" : "false"}>
          <PlayerErrorBoundary>
            <PlayingTabPanel
              song={player.currentSong}
              textSecondary={textSecondary}
              textPrimary={textPrimary}
              accentText={accentText}
              hoverSurface={hoverSurface}
              contentSurface={contentSurface}
              contentSurfaceColor={contentSurfaceColor}
            />
          </PlayerErrorBoundary>
        </div>

        <div className={activeTab === "all-tracks" ? "block" : "hidden"}>
          <AllTracksTabPanel
            songs={library.songs}
            filteredSongs={library.filteredSongs}
            selectedSongId={selectedSongId}
            allTracksView={settings.allTracksView}
            textSecondary={textSecondary}
            hoverSurface={hoverSurface}
            searchSurface={searchSurface}
            menuSurface={menuSurface}
            menuHover={menuHover}
            trackBase={trackBase}
            shadowSoft={shadowSoft}
            accentHex={accentHex}
            searchIconColor={searchIconColor}
            iconMutedColor={iconMutedColor}
            menuBorderColor={menuBorderColor}
            dangerTextColor={dangerTextColor}
            dangerSurfaceColor={dangerSurfaceColor}
            searchQuery={library.searchQuery}
            onSearchChange={library.onSearchChange}
            onSearchEnter={handleSearchEnter}
            onViewChange={library.onViewChange}
            onSelectSong={setSelectedSongId}
            onDeleteSong={library.deleteSong}
          />
        </div>

        <div className={activeTab === "upload" ? "block" : "hidden"}>
          <UploadTabPanel
            textSecondary={textSecondary}
            contentSurface={contentSurface}
            contentSurfaceColor={contentSurfaceColor}
            uploadLimit={uploadLimit}
            uploadsRemaining={uploadsRemaining}
            onUploaded={library.refreshSongs}
          />
        </div>

        <PlayerErrorBoundary>
          <PlayerFooter
            floatingSurface={floatingSurface}
            floatingSurfaceColor={floatingSurfaceColor}
            textSecondary={textSecondary}
            ghostButton={ghostButton}
            accentHex={accentHex}
            canPlay={Boolean(player.currentSong)}
            isPlaying={player.isPlaying}
            duration={player.duration}
            currentTime={player.currentTime}
            volume={settings.volume}
            currentSong={player.currentSong}
            isVolumeOpen={isVolumeOpen}
            setIsVolumeOpen={setIsVolumeOpen}
            onSeek={player.seekTo}
            onTogglePlay={player.togglePlayPause}
            onNext={player.goNext}
            onPrevious={player.goPrevious}
            onToggleShuffle={player.onToggleShuffle}
            onToggleRepeat={player.toggleRepeatMode}
            isShuffle={settings.isShuffle}
            onVolumeChange={settings.setVolume}
            formatTime={player.formatTime}
            volumeWrapRef={volumeWrapRef}
            repeatMode={settings.repeatMode}
            playbackError={player.playbackError}
          />
        </PlayerErrorBoundary>

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={settings.theme}
          onThemeChange={settings.setTheme}
          customPalette={settings.customPalette}
          onCustomPaletteChange={settings.setCustomPalette}
          isAutoplay={settings.isAutoplay}
          onToggleAutoplay={handleToggleAutoplay}
          surfaceColor={floatingSurfaceColor}
          textPrimaryColor={textPrimaryColor}
          textSecondaryColor={textSecondaryColor}
          accentHex={accentHex}
          shadowSoft={shadowSoft}
          successTextColor={successTextColor}
          dangerTextColor={dangerTextColor}
          modalOverlayColor={modalOverlayColor}
        />

        <audio
          ref={player.audioRef}
          preload="metadata"
          onEnded={player.onEnded}
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
    </SettingsContext.Provider>
  );
}
