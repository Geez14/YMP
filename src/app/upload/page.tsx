import Link from "next/link";
import { redirect } from "next/navigation";

import UploadClient from "@/components/upload-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/upload");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "1.25rem 1rem",
        display: "grid",
        gap: "1rem",
        alignContent: "start",
        maxWidth: 860,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ fontSize: "clamp(1.35rem, 2.6vw, 2rem)" }}>Upload Songs</h1>
          <p style={{ opacity: 0.8 }}>Upload and compress songs here, then manage them on dashboard.</p>
        </div>
        <Link
          href="/dashboard"
          style={{
            border: "1px solid rgba(35, 77, 102, 0.24)",
            borderRadius: 999,
            padding: "0.5rem 0.95rem",
            background: "rgba(255,255,255,0.8)",
            color: "#1f4b67",
          }}
        >
          Back to dashboard
        </Link>
      </div>

      <UploadClient />
    </main>
  );
}
