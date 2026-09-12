import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

// Keep a single sqlite connection across hot reloads in dev.
declare global {
  // eslint-disable-next-line no-var
  var __dayready_sqlite: Database.Database | undefined;
}

const dbPath = process.env.DATABASE_URL?.replace("file:", "") || "./dev.db";
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

const sqlite =
  global.__dayready_sqlite ??
  new Database(resolvedPath);

if (process.env.NODE_ENV !== "production") {
  global.__dayready_sqlite = sqlite;
}

sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

// --- Lightweight auto-migration (no network required) ---
// Creates tables if they don't already exist. Safe to run on every boot.
const migrationsMarker = path.join(process.cwd(), ".data", ".migrated");

export function ensureSchema() {
  sqlite.exec(`
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
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      category TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
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
      created_at TEXT NOT NULL DEFAULT (current_timestamp)
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
      logged_at TEXT NOT NULL DEFAULT (current_timestamp)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_meals_user ON meals(user_id);
  `);

  fs.mkdirSync(path.dirname(migrationsMarker), { recursive: true });
  fs.writeFileSync(migrationsMarker, new Date().toISOString());
}

ensureSchema();
