/**
 * Food search combining:
 * 1. McCance & Widdowson's-style UK raw ingredient data (local, instant)
 * 2. Open Food Facts API (remote, no API key required)
 *
 * Barcode lookup via Open Food Facts product API
 */

import { ukFoodData, type UKFoodItem } from "./ukFoodData";

export interface FoodSearchItem {
  food_name: string;
  brand_name?: string;
  external_id: string;
  calories: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fibre_g?: number;
  serving_qty: number;
  serving_unit: string;
  thumbnail_url?: string;
}

export interface FoodSearchResult {
  products: FoodSearchItem[];
}

// ---------------------------------------------------------------------------
// Open Food Facts types
// ---------------------------------------------------------------------------

interface OFFNutriments {
  "energy-kcal_100g"?: number;
  proteins_100g?: number;
  carbohydrates_100g?: number;
  fat_100g?: number;
  fiber_100g?: number;
}

interface OFFProduct {
  product_name?: string;
  brands?: string;
  code?: string;
  nutriments?: OFFNutriments;
  serving_size?: string;
  serving_quantity?: number;
  image_small_url?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseServingUnit = (servingSize?: string): string => {
  if (!servingSize) return "g";
  const match = servingSize.match(/[\d.]+\s*(g|ml|oz|cl|l|kg)\b/i);
  return match?.[1] ? match[1].toLowerCase() : "g";
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

const mapOFFProduct = (product: OFFProduct): FoodSearchItem | null => {
  if (!product.product_name) return null;

  const servingQty = product.serving_quantity || 100;
  const scale = servingQty / 100;
  const n = product.nutriments || {};

  return {
    food_name: product.product_name,
    brand_name: product.brands || undefined,
    external_id: product.code || "",
    calories: Math.round((n["energy-kcal_100g"] || 0) * scale),
    protein_g: round1((n.proteins_100g || 0) * scale),
    carbs_g: round1((n.carbohydrates_100g || 0) * scale),
    fat_g: round1((n.fat_100g || 0) * scale),
    fibre_g: round1((n.fiber_100g || 0) * scale),
    serving_qty: servingQty,
    serving_unit: parseServingUnit(product.serving_size),
    thumbnail_url: product.image_small_url || undefined,
  };
};

// ---------------------------------------------------------------------------
// Local (McCance & Widdowson) search
// ---------------------------------------------------------------------------

const mapLocalFood = (item: UKFoodItem): FoodSearchItem => ({
  food_name: item.name,
  brand_name: undefined,
  external_id: `uk_${item.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
  calories: Math.round(item.calories),
  protein_g: round1(item.protein),
  carbs_g: round1(item.carbs),
  fat_g: round1(item.fat),
  fibre_g: round1(item.fibre),
  serving_qty: 100,
  serving_unit: "g",
  thumbnail_url: undefined,
});

const searchLocalFoods = (query: string): FoodSearchItem[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored: Array<{ item: UKFoodItem; score: number }> = [];

  for (const item of ukFoodData) {
    const nameLower = item.name.toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (nameLower.includes(term)) {
        score += 1;
        // Boost for exact word boundary matches
        if (nameLower.startsWith(term) || nameLower.includes(` ${term}`)) {
          score += 0.5;
        }
      }
    }

    if (score > 0) {
      scored.push({ item, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 15)
    .map(({ item }) => mapLocalFood(item));
};

// ---------------------------------------------------------------------------
// Open Food Facts search
// ---------------------------------------------------------------------------

const searchOpenFoodFacts = async (
  query: string,
): Promise<FoodSearchItem[]> => {
  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "20",
      country: "united-kingdom",
      fields:
        "product_name,brands,code,nutriments,serving_size,serving_quantity,image_small_url",
    });

    const res = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`,
    );

    if (!res.ok) return [];

    const data = (await res.json()) as { products?: OFFProduct[] };
    return (data.products || [])
      .map(mapOFFProduct)
      .filter((p): p is FoodSearchItem => p !== null);
  } catch {
    // Gracefully degrade when Open Food Facts is unreachable
    return [];
  }
};

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

const normalise = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]/g, "");

const deduplicate = (items: FoodSearchItem[]): FoodSearchItem[] => {
  const seen = new Set<string>();
  const results: FoodSearchItem[] = [];

  for (const item of items) {
    const key = normalise(item.food_name);
    if (!seen.has(key)) {
      seen.add(key);
      results.push(item);
    }
  }

  return results;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const foodSearch = {
  /**
   * Search foods by text query
   * Returns local UK food data first, then Open Food Facts results
   */
  async search(query: string): Promise<FoodSearchResult> {
    const localResults = searchLocalFoods(query);
    const offResults = await searchOpenFoodFacts(query);

    const combined = deduplicate([...localResults, ...offResults]).slice(0, 30);
    return { products: combined };
  },

  /**
   * Look up a product by barcode via Open Food Facts
   */
  async lookupBarcode(barcode: string): Promise<FoodSearchItem | null> {
    try {
      const fields =
        "product_name,brands,code,nutriments,serving_size,serving_quantity,image_small_url";
      const res = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=${fields}`,
      );

      if (!res.ok) return null;

      const data = (await res.json()) as {
        status: number;
        product?: OFFProduct;
      };
      if (data.status !== 1 || !data.product) return null;

      return mapOFFProduct(data.product);
    } catch {
      return null;
    }
  },
};
