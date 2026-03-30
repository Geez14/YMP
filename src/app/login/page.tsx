"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { APP_ROUTES } from "@/lib/routes";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}><p>Loading...</p></section></main>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);

    const nextPath = searchParams.get("next") || APP_ROUTES.DASHBOARD;
    const redirectTo = `${window.location.origin}${APP_ROUTES.AUTH_CALLBACK}?next=${encodeURIComponent(nextPath)}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (signInError) {
      setError(signInError.message);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.glowOne} aria-hidden />
      <div className={styles.glowTwo} aria-hidden />

      <section className={styles.shell}>
        <div className={styles.hero}>
          <span className={styles.badge}>YMP · Private Access</span>
          <h1>Sign in to your music workspace</h1>
          <p className={styles.lead}>
            Keep uploads synced, playback state remembered, and your library locked to your account.
          </p>
          <ul className={styles.points}>
            <li>Google login out of the box; other providers can be added in Supabase</li>
            <li>Session recovery with your saved settings</li>
            <li>No marketing emails—just your music</li>
          </ul>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <p className={styles.kicker}>Secure sign-in</p>
            <h2>Continue with Google</h2>
            <p className={styles.muted}>We only request your email to verify access to your library. Additional providers can be enabled later.</p>
          </div>

          <button className={styles.primary} onClick={signInWithGoogle} type="button">
            Continue with Google
          </button>

          {searchParams.get("error") ? <p className={styles.warning}>{searchParams.get("error")}</p> : null}
          {error ? <p className={styles.error}>{error}</p> : null}

          <p className={styles.disclaimer}>
            By continuing, you agree to allow YMP to authenticate with your Google account for identity only.
          </p>
        </div>
      </section>
    </main>
  );
}
