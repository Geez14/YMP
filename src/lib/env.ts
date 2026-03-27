type RequiredEnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "DATABASE_URL";

const envReaders: Record<RequiredEnvKey, () => string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: () => process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: () => process.env.SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL: () => process.env.DATABASE_URL,
};

function readEnv(name: RequiredEnvKey): string {
  // Keep static property access via readers so Next.js/Turbopack can inline NEXT_PUBLIC_* vars.
  const value = envReaders[name]();

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    return readEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY(): string {
    return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return readEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
  get DATABASE_URL(): string {
    return readEnv("DATABASE_URL");
  },
};
