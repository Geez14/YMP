"use client";

import { useMemo } from "react";

import { APP_ROUTES } from "@/lib/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function useDashboardSession() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.assign(APP_ROUTES.LOGIN);
  }

  return { logout };
}
