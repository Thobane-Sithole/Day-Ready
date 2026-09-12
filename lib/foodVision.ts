import { GoogleGenAI } from "@google/genai";

export type FoodItem = {
  name: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type FoodAnalysis = {
  items: FoodItem[];
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  confidence: "low" | "medium" | "high";
  notes: string;
};

const SYSTEM_PROMPT = `You are a nutrition-estimation assistant analyzing a photo of food.
Identify each distinct food item visible, estimate its portion size in grams using visual
cues (plate size, utensils, typical serving sizes), and estimate calories and macros for
that portion. Be a careful, conservative estimator — it is fine to be approximate.

Respond with STRICT JSON ONLY, no markdown fences, no commentary, matching exactly this shape:
{
  "items": [
    {"name": string, "estimated_grams": number, "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number}
  ],
  "total_calories": number,
  "total_protein_g": number,
  "total_carbs_g": number,
  "total_fat_g": number,
  "confidence": "low" | "medium" | "high",
  "notes": string
}
If the image does not clearly show food, return an empty items array, all totals as 0,
confidence "low", and explain briefly in notes.`;

/**
 * Uses Google's Gemini API (free tier available, no credit card required —
 * see https://aistudio.google.com/apikey) to analyze a food photo and return
 * an estimated calorie/macro breakdown.
 *
 * Swap in Claude's vision API instead by replacing this function's body with
 * an @anthropic-ai/sdk call — the SYSTEM_PROMPT and return shape above are
 * provider-agnostic and don't need to change.
 */
export async function analyzeFoodImage(base64Image: string, mediaType: string): Promise<FoodAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: mediaType, data: base64Image } },
          { text: "Analyze this meal photo and return the calorie/macro estimate JSON described in your instructions." },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from the vision model.");
  }

  const cleaned = text.replace(/```json|```/g, "").trim();

  let parsed: FoodAnalysis;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Could not parse the nutrition analysis. Please try again with a clearer photo.");
  }

  // Defensive defaults in case the model omits a field.
  return {
    items: Array.isArray(parsed.items) ? parsed.items : [],
    total_calories: parsed.total_calories ?? 0,
    total_protein_g: parsed.total_protein_g ?? 0,
    total_carbs_g: parsed.total_carbs_g ?? 0,
    total_fat_g: parsed.total_fat_g ?? 0,
    confidence: parsed.confidence ?? "low",
    notes: parsed.notes ?? "",
  };
}
