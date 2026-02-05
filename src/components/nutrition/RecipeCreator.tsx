import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react'
import FoodSearch from './FoodSearch'
import { FoodItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

interface RecipeCreatorProps {
  onBack: () => void
  onComplete: () => void
}

interface Ingredient extends FoodItem {
  amount_g: number
}

export default function RecipeCreator({ onBack, onComplete }: RecipeCreatorProps) {
  const [step, setStep] = useState<'details' | 'ingredients'>('details')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  // Computed totals
  const totalWeight = ingredients.reduce((sum, i) => sum + i.amount_g, 0)
  const totalCalories = ingredients.reduce((sum, i) => sum + (i.calories_100g * (i.amount_g / 100)), 0)
  const totalProtein = ingredients.reduce((sum, i) => sum + (i.protein_100g * (i.amount_g / 100)), 0)
  const totalCarbs = ingredients.reduce((sum, i) => sum + (i.carbs_100g * (i.amount_g / 100)), 0)
  const totalFat = ingredients.reduce((sum, i) => sum + (i.fat_100g * (i.amount_g / 100)), 0)

  const handleAddIngredient = (item: FoodItem) => {
    // Default 100g, user can edit
    setIngredients([...ingredients, { ...item, amount_g: 100 }])
    setIsSearching(false)
  }

  const updateAmount = (index: number, amount: number) => {
    const newIng = [...ingredients]
    newIng[index].amount_g = amount
    setIngredients(newIng)
  }

  const removeIngredient = (index: number) => {
    const newIng = [...ingredients]
    newIng.splice(index, 1)
    setIngredients(newIng)
  }

  const handleSave = async () => {
    if (!user || !name) return
    
    try {
        // 1. Create/Upsert Food Item representation of this recipe for easy logging
        // Calculate 100g values
        const factor = totalWeight > 0 ? (100 / totalWeight) : 0
        const cal100 = totalCalories * factor
        const pro100 = totalProtein * factor
        const carb100 = totalCarbs * factor
        const fat100 = totalFat * factor

        const { data: foodItem, error: fError } = await supabase
            .from('food_items')
            .insert({
                user_id: user.id,
                name: name,
                brand: 'My Recipes',
                calories_100g: cal100,
                protein_100g: pro100,
                carbs_100g: carb100,
                fat_100g: fat100,
                is_custom: true
            })
            .select()
            .single()
        
        if (fError) throw fError

        // 2. Create Recipe linked to this food item (if we want to edit it later, we need to link them, 
        // strictly speaking we should add a food_item_id to recipes table, but for now let's just create the recipe record)
        const { data: recipe, error: rError } = await supabase
            .from('recipes')
            .insert({
                user_id: user.id,
                name,
                description,
                total_calories: totalCalories,
                total_protein: totalProtein,
                total_carbs: totalCarbs,
                total_fat: totalFat
            })
            .select()
            .single()

        if (rError) throw rError

        // 3. Add Ingredients
        // First ensure all food items are in DB
        const ingredientPromises = ingredients.map(async (ing) => {
            let foodId = ing.id
            if (!foodId) {
                const { data: newFood } = await supabase
                    .from('food_items')
                    .insert({
                         user_id: user.id,
                         name: ing.name,
                         brand: ing.brand,
                         calories_100g: ing.calories_100g,
                         protein_100g: ing.protein_100g,
                         carbs_100g: ing.carbs_100g,
                         fat_100g: ing.fat_100g,
                         barcode: ing.barcode,
                         is_custom: false
                    })
                    .select()
                    .single()
                foodId = newFood?.id
            }
            
            if (foodId) {
                return supabase.from('recipe_ingredients').insert({
                    user_id: user.id,
                    recipe_id: recipe.id,
                    food_item_id: foodId,
                    amount_g: ing.amount_g
                })
            }
        })

        await Promise.all(ingredientPromises)
        queryClient.invalidateQueries({ queryKey: ['recipes'] })
        onComplete()

    } catch (e) {
        console.error(e)
        alert('Error saving recipe')
    }
  }

  if (isSearching) {
    return (
        <div className="space-y-4">
            <Button variant="ghost" onClick={() => setIsSearching(false)}>← Back to Recipe</Button>
            <FoodSearch onSelect={handleAddIngredient} />
        </div>
    )
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft /></Button>
        <h2 className="text-xl font-bold">Create Recipe</h2>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <div className="space-y-2">
            <label className="text-sm font-medium">Recipe Name</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. My Breakfast Shake" />
        </div>
        
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Ingredients ({ingredients.length})</label>
                <Button size="sm" variant="outline" onClick={() => setIsSearching(true)}>
                    <Plus size={14} className="mr-1" /> Add
                </Button>
            </div>
            
            <div className="space-y-2">
                {ingredients.map((ing, idx) => (
                    <Card key={idx} className="p-3">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-semibold">{ing.name}</div>
                                <div className="text-xs text-muted-foreground">{Math.round(ing.calories_100g * (ing.amount_g/100))} kcal</div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeIngredient(idx)}>
                                <Trash2 size={14} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="number" 
                                className="h-8 w-24" 
                                value={ing.amount_g} 
                                onChange={(e) => updateAmount(idx, parseFloat(e.target.value))} 
                            />
                            <span className="text-sm text-muted-foreground">g</span>
                        </div>
                    </Card>
                ))}
                {ingredients.length === 0 && (
                    <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                        No ingredients yet
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="border-t pt-4 bg-background">
         <div className="flex justify-between items-center mb-4 text-sm font-medium">
            <span>Total:</span>
            <span>{Math.round(totalCalories)} kcal</span>
         </div>
         <Button className="w-full" onClick={handleSave} disabled={!name || ingredients.length === 0}>
            <Save className="mr-2" size={16} /> Save Recipe
         </Button>
      </div>
    </div>
  )
}
