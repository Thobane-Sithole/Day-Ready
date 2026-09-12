import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

// Keep a single connection across hot reloads in dev and warm serverless
// invocations in production.
declare global {
  // eslint-disable-next-line no-var
  var __dayready_pg: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;

// Don't throw at module load time — that would break `next build`, which
// imports this module without a real DATABASE_URL configured. Queries made
// against the placeholder will fail at request time with a clear error
// instead, which is the right place to surface a missing config.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString ?? "");

const client =
  global.__dayready_pg ??
  postgres(connectionString ?? "postgres://placeholder:placeholder@localhost:5432/placeholder", {
    prepare: false, // required for transaction-mode poolers (Neon, Supabase pgbouncer)
    max: 1, // one connection per serverless function instance, reused across warm invocations
    ssl: isLocal ? false : "require",
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__dayready_pg = client;
}

export const db = drizzle(client, { schema });

// --- Lightweight auto-migration (idempotent, safe to run on every cold start) ---
const DDL = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'UTC',
    daily_calorie_goal INTEGER NOT NULL DEFAULT 2000,
    protein_goal_g INTEGER NOT NULL DEFAULT 120,
    carbs_goal_g INTEGER NOT NULL DEFAULT 250,
    fat_goal_g INTEGER NOT NULL DEFAULT 70,
    theme TEXT NOT NULL DEFAULT 'light',
    created_at TEXT NOT NULL DEFAULT now()::text
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_at TEXT,
    priority TEXT NOT NULL DEFAULT 'MEDIUM',
    category TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT now()::text
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    color TEXT DEFAULT '#6C63FF',
    reminder_min INTEGER,
    created_at TEXT NOT NULL DEFAULT now()::text
  );

  CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_data_url TEXT NOT NULL,
    items TEXT NOT NULL,
    total_calories INTEGER NOT NULL DEFAULT 0,
    total_protein INTEGER NOT NULL DEFAULT 0,
    total_carbs INTEGER NOT NULL DEFAULT 0,
    total_fat INTEGER NOT NULL DEFAULT 0,
    confidence TEXT NOT NULL DEFAULT 'medium',
    notes TEXT,
    logged_at TEXT NOT NULL DEFAULT now()::text
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
  CREATE INDEX IF NOT EXISTS idx_meals_user ON meals(user_id);
`;

let schemaReady: Promise<void> | null = null;

/**
 * Ensures the tables exist. Cheap and idempotent (CREATE TABLE IF NOT EXISTS),
 * so it's safe to await at the top of every request — after the first cold
 * start it resolves instantly from the cached promise. For larger teams or
 * schema changes beyond this MVP, switch to `drizzle-kit push`/`generate`
 * (see package.json's `db:push` script) instead of relying on this.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = client.unsafe(DDL).then(() => undefined);
  }
  return schemaReady;
}
