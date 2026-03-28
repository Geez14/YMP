import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(safeNext)}`,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Preserve any existing role; only ensure the profile record exists/has the latest email.
      const { error: upsertError } = await supabaseServiceClient
        .from("profiles")
        .upsert(
          {
            user_id: user.id,
            email: user.email ?? null,
          },
          { onConflict: "user_id" },
        );

      if (upsertError) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(`Profile sync failed: ${upsertError.message}`)}&next=${encodeURIComponent(safeNext)}`,
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
