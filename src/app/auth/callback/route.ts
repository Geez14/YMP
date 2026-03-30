import { NextResponse } from "next/server";

import { APP_ROUTES, buildLoginRedirect } from "@/lib/routes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || APP_ROUTES.DASHBOARD;
  const safeNext = next.startsWith("/") ? next : APP_ROUTES.DASHBOARD;

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}${buildLoginRedirect(safeNext, error.message)}`,
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
          `${origin}${buildLoginRedirect(safeNext, `Profile sync failed: ${upsertError.message}`)}`,
        );
      }
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
