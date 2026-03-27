"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setError(null);

    const nextPath = searchParams.get("next") || "/dashboard";
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
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
      <section className={styles.card}>
        <h1>MyMusic Private Access</h1>
        <p>
          Sign in with Google to access your private music dashboard.
        </p>

        <button className={styles.primary} onClick={signInWithGoogle} type="button">
          Continue with Google
        </button>

        {searchParams.get("error") ? (
          <p className={styles.warning}>{searchParams.get("error")}</p>
        ) : null}
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>
    </main>
  );
}
