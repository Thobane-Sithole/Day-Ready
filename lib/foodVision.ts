import Anthropic from "@anthropic-ai/sdk";

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

export async function analyzeFoodImage(base64Image: string, mediaType: string): Promise<FoodAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured on the server.");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as "image/jpeg" | "image/png" | "image/webp",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: "Analyze this meal photo and return the calorie/macro estimate JSON described in your instructions.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from vision model.");
  }

  const cleaned = textBlock.text.replace(/```json|```/g, "").trim();

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
