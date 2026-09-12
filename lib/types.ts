export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type Task = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  priority: Priority;
  category: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
};

export type Event = {
  id: string;
  userId: string;
  title: string;
  location: string | null;
  startAt: string;
  endAt: string;
  color: string | null;
  reminderMin: number | null;
  createdAt: string;
};

export type FoodItem = {
  name: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type Meal = {
  id: string;
  userId: string;
  imageDataUrl: string;
  items: FoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: string;
  notes: string | null;
  loggedAt: string;
};

export type UserSettings = {
  id: string;
  name: string;
  email: string;
  timezone: string;
  dailyCalorieGoal: number;
  proteinGoalG: number;
  carbsGoalG: number;
  fatGoalG: number;
  theme: "light" | "dark";
};
