import dns from "node:dns";
import postgres from "postgres";

import { env } from "@/lib/env";

dns.setDefaultResultOrder("ipv4first");

declare global {
  var __mymusicSql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  global.__mymusicSql ??
  postgres(env.DATABASE_URL, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  global.__mymusicSql = sql;
}
