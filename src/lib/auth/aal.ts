import type { SupabaseClient } from "@supabase/supabase-js";

export function isAal2(level: string | null | undefined): boolean {
  return level === "aal2";
}

export async function getCurrentAal(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) {
    return null;
  }

  return data.currentLevel;
}
