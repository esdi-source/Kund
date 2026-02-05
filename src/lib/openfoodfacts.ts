import { FoodItem, OpenFoodFactsProduct } from '@/types'

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v2/product'
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'

export async function fetchProductByBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const response = await fetch(`${OFF_API_URL}/${barcode}.json`)
    const data: OpenFoodFactsProduct = await response.json()

    if (!data.product) return null

    return {
      name: data.product.product_name || 'Unknown Product',
      brand: data.product.brands || '',
      calories_100g: data.product.nutriments["energy-kcal_100g"] || 0,
      protein_100g: data.product.nutriments.proteins_100g || 0,
      carbs_100g: data.product.nutriments.carbohydrates_100g || 0,
      fat_100g: data.product.nutriments.fat_100g || 0,
      barcode: data.code,
      is_custom: false
    }
  } catch (error) {
    console.error('Error fetching from OFF:', error)
    return null
  }
}

export async function searchProductsByName(query: string): Promise<FoodItem[]> {
  try {
    const url = `${OFF_SEARCH_URL}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.products) return []

    return data.products.map((p: any) => ({
      name: p.product_name || 'Unknown',
      brand: p.brands || '',
      calories_100g: p.nutriments?.["energy-kcal_100g"] || 0,
      protein_100g: p.nutriments?.proteins_100g || 0,
      carbs_100g: p.nutriments?.carbohydrates_100g || 0,
      fat_100g: p.nutriments?.fat_100g || 0,
      barcode: p.code,
      is_custom: false
    })).filter((item: FoodItem) => item.calories_100g >= 0) // Filter out incomplete data
  } catch (error) {
    console.error('Error searching OFF:', error)
    return []
  }
}
