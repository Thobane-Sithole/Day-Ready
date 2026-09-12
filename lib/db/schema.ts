import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // null for accounts created via Google sign-in
  timezone: text("timezone").notNull().default("UTC"),
  dailyCalorieGoal: integer("daily_calorie_goal").notNull().default(2000),
  proteinGoalG: integer("protein_goal_g").notNull().default(120),
  carbsGoalG: integer("carbs_goal_g").notNull().default(250),
  fatGoalG: integer("fat_goal_g").notNull().default(70),
  theme: text("theme").notNull().default("light"),
  resetToken: text("reset_token"),
  resetTokenExpiresAt: text("reset_token_expires_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()::text`),
});

export const tasks = pgTable("tasks", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueAt: text("due_at"),
  priority: text("priority").notNull().default("MEDIUM"), // LOW | MEDIUM | HIGH
  category: text("category"),
  completed: boolean("completed").notNull().default(false),
  completedAt: text("completed_at"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()::text`),
});

export const events = pgTable("events", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  location: text("location"),
  startAt: text("start_at").notNull(),
  endAt: text("end_at").notNull(),
  color: text("color").default("#6C63FF"),
  reminderMin: integer("reminder_min"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`now()::text`),
});

export const meals = pgTable("meals", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("user_id").notNull(),
  imageDataUrl: text("image_data_url").notNull(),
  items: text("items").notNull(), // JSON string
  totalCalories: integer("total_calories").notNull().default(0),
  totalProtein: integer("total_protein").notNull().default(0),
  totalCarbs: integer("total_carbs").notNull().default(0),
  totalFat: integer("total_fat").notNull().default(0),
  confidence: text("confidence").notNull().default("medium"),
  notes: text("notes"),
  loggedAt: text("logged_at")
    .notNull()
    .default(sql`now()::text`),
});
