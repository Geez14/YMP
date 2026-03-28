import dns from "node:dns";
import postgres from "postgres";

dns.setDefaultResultOrder("ipv4first");

declare global {
  var __mymusicSql: ReturnType<typeof postgres> | undefined;
}

function createSqlClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("Missing environment variable: DATABASE_URL");
  }

  return postgres(databaseUrl, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: "require",
  });
}

function getSqlClient() {
  if (!global.__mymusicSql) {
    global.__mymusicSql = createSqlClient();
  }

  return global.__mymusicSql;
}

export const sql = new Proxy({} as ReturnType<typeof postgres>, {
  get(_target, prop, receiver) {
    const client = getSqlClient() as unknown as Record<PropertyKey, unknown>;
    return Reflect.get(client, prop, receiver);
  },
});

if (process.env.NODE_ENV !== "production") {
  // Keep one shared connection in dev HMR sessions.
  global.__mymusicSql = getSqlClient();
}
