export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  AUTH_CALLBACK: "/auth/callback",
  DASHBOARD: "/dashboard",
  UPLOAD: "/upload",
} as const;

export const API_ROUTES = {
  UPLOAD: "/api/upload",
  streamBySongId: (songId: string) => `/api/stream/${songId}`,
  coverBySongId: (songId: string) => `/api/cover/${songId}`,
} as const;

export function buildLoginRedirect(nextPath: string, error?: string) {
  const safeNext = nextPath.startsWith("/") ? nextPath : APP_ROUTES.DASHBOARD;
  const params = new URLSearchParams({ next: safeNext });
  if (error) {
    params.set("error", error);
  }
  return `${APP_ROUTES.LOGIN}?${params.toString()}`;
}
