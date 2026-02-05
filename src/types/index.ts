export interface FoodItem {
  id?: string
  user_id?: string
  name: string
  brand?: string
  calories_100g: number
  protein_100g: number
  carbs_100g: number
  fat_100g: number
  barcode?: string
  is_custom?: boolean
  serving_size?: string
}

export interface DiaryEntry {
  id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  food_item_id?: string
  recipe_id?: string
  amount_g?: number
  servings?: number
  calories: number
  protein: number
  carbs: number
  fat: number
  food_item?: FoodItem
}

export interface OpenFoodFactsProduct {
  code: string
  product: {
    product_name?: string
    brands?: string
    nutriments: {
      "energy-kcal_100g"?: number
      proteins_100g?: number
      carbohydrates_100g?: number
      fat_100g?: number
    }
  }
}
