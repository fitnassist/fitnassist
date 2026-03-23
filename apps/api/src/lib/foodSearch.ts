/**
 * USDA FoodData Central API integration
 * Free, government-run food database with comprehensive nutrition data
 * https://fdc.nal.usda.gov/api-guide
 *
 * Get a free API key at: https://api.data.gov/signup/
 * DEMO_KEY works but is rate-limited to 30 req/hour
 */

import { env } from '../config/env';

const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

// Nutrient IDs in the USDA database
const NUTRIENT_IDS = {
  ENERGY_KCAL: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  FIBER: 1079,
} as const;

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

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  dataType: string;
  brandOwner?: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  foodNutrients: USDANutrient[];
}

const getNutrient = (nutrients: USDANutrient[], id: number): number | undefined => {
  const n = nutrients.find((n) => n.nutrientId === id);
  return n?.value;
};

const parseFood = (f: USDAFood): FoodSearchItem | null => {
  if (!f.description) return null;

  const calories = getNutrient(f.foodNutrients, NUTRIENT_IDS.ENERGY_KCAL);
  if (calories == null) return null;

  // Determine serving info
  // USDA nutrients are per 100g unless servingSize is specified
  const servingSize = f.servingSize || 100;
  const servingUnit = f.servingSizeUnit || 'g';

  // Scale nutrients from per-100g to per-serving
  const scale = servingSize / 100;

  return {
    food_name: f.description,
    brand_name: f.brandOwner || f.brandName || undefined,
    external_id: String(f.fdcId),
    calories: Math.round(calories * scale),
    protein_g: getNutrient(f.foodNutrients, NUTRIENT_IDS.PROTEIN) != null
      ? Math.round((getNutrient(f.foodNutrients, NUTRIENT_IDS.PROTEIN)! * scale) * 10) / 10
      : undefined,
    carbs_g: getNutrient(f.foodNutrients, NUTRIENT_IDS.CARBS) != null
      ? Math.round((getNutrient(f.foodNutrients, NUTRIENT_IDS.CARBS)! * scale) * 10) / 10
      : undefined,
    fat_g: getNutrient(f.foodNutrients, NUTRIENT_IDS.FAT) != null
      ? Math.round((getNutrient(f.foodNutrients, NUTRIENT_IDS.FAT)! * scale) * 10) / 10
      : undefined,
    fibre_g: getNutrient(f.foodNutrients, NUTRIENT_IDS.FIBER) != null
      ? Math.round((getNutrient(f.foodNutrients, NUTRIENT_IDS.FIBER)! * scale) * 10) / 10
      : undefined,
    serving_qty: servingSize,
    serving_unit: f.householdServingFullText || servingUnit,
  };
};

const getApiKey = () => env.USDA_API_KEY || 'DEMO_KEY';

export const foodSearch = {
  /**
   * Search foods by text query
   */
  async search(query: string): Promise<FoodSearchResult> {
    const apiKey = getApiKey();
    const url = `${BASE_URL}/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageSize=20`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Food search failed: ${res.status}`);

    const data = await res.json() as { foods?: USDAFood[] };
    const products = (data.foods || [])
      .map(parseFood)
      .filter((p): p is FoodSearchItem => p !== null);

    return { products };
  },

  /**
   * Get food details by FDC ID
   */
  async getProduct(fdcId: string): Promise<FoodSearchItem | null> {
    const apiKey = getApiKey();
    const url = `${BASE_URL}/food/${fdcId}?api_key=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Food lookup failed: ${res.status}`);

    const data = await res.json() as USDAFood;
    return parseFood(data);
  },
};
