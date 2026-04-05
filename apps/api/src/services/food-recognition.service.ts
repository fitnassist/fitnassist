import Anthropic from "@anthropic-ai/sdk";
import { TRPCError } from "@trpc/server";
import { env } from "../config/env";

interface RecognizedFood {
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  servingSize: string;
  confidence: "high" | "medium" | "low";
}

export const foodRecognitionService = {
  async recognizeFromImage(imageBase64: string): Promise<RecognizedFood[]> {
    if (!env.ANTHROPIC_API_KEY) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "AI food recognition is not configured",
      });
    }

    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    let response;
    try {
      response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Identify all food items visible in this image. For each item, estimate the portion size and nutritional values.

Return ONLY a JSON array with this exact structure (no other text):
[
  {
    "name": "food item name",
    "calories": estimated calories (number),
    "proteinG": estimated protein in grams (number),
    "carbsG": estimated carbs in grams (number),
    "fatG": estimated fat in grams (number),
    "servingSize": "estimated portion description e.g. '1 medium bowl' or '200g'",
    "confidence": "high" | "medium" | "low"
  }
]

Use UK food names and realistic portion sizes. If you can't identify a food item clearly, set confidence to "low". Base nutritional estimates on standard UK nutritional data.`,
            },
          ],
        },
      ],
    });
    } catch (err: any) {
      console.error('[FoodRecognition] Anthropic API error:', err?.message || err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `AI recognition failed: ${err?.message || 'Unknown error'}`,
      });
    }

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((item: any) => ({
        name: String(item.name ?? "Unknown food"),
        calories: Number(item.calories) || 0,
        proteinG: Number(item.proteinG) || 0,
        carbsG: Number(item.carbsG) || 0,
        fatG: Number(item.fatG) || 0,
        servingSize: String(item.servingSize ?? "1 serving"),
        confidence: ["high", "medium", "low"].includes(item.confidence)
          ? item.confidence
          : "low",
      }));
    } catch {
      return [];
    }
  },
};
