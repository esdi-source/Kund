import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FoodItem } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

interface FoodEntryDialogProps {
  foodItem: FoodItem
  onClose: () => void
  date: string
  mealType: string
}

export default function FoodEntryDialog({ foodItem, onClose, date, mealType }: FoodEntryDialogProps) {
  const [amount, setAmount] = useState('100') // default 100g
  const [loading, setLoading] = useState(false)
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()

  const calories = (Number(amount) / 100) * foodItem.calories_100g
  const protein = (Number(amount) / 100) * foodItem.protein_100g
  const carbs = (Number(amount) / 100) * foodItem.carbs_100g
  const fat = (Number(amount) / 100) * foodItem.fat_100g

  const handleSave = async () => {
    if (!user) return
    setLoading(true)

    try {
      // 1. Ensure food item exists in our DB (or ref it if we decide to cache everything scanned)
      // For now, simpler approach: If it has an ID, use it. If not (from API), insert it first.
      
      let foodId = foodItem.id

      if (!foodId) {
        // Insert new food item from API cache to DB
        const { data: newFood, error: foodError } = await supabase
          .from('food_items')
          .insert({
            user_id: user.id,
            name: foodItem.name,
            brand: foodItem.brand,
            calories_100g: foodItem.calories_100g,
            protein_100g: foodItem.protein_100g,
            carbs_100g: foodItem.carbs_100g,
            fat_100g: foodItem.fat_100g,
            barcode: foodItem.barcode,
            is_custom: false
          })
          .select()
          .single()
        
        if (foodError) throw foodError
        foodId = newFood.id
      }

      // 2. Insert diary entry
      const { error: diaryError } = await supabase
        .from('diary_entries')
        .insert({
          user_id: user.id,
          date: date,
          meal_type: mealType,
          food_item_id: foodId,
          amount_g: Number(amount),
          calories,
          protein,
          carbs,
          fat
        })

      if (diaryError) throw diaryError

      // Invalidate queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['diary', date] })
      onClose()

    } catch (error) {
      console.error('Error saving entry:', error)
      alert('Failed to save entry')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{foodItem.name}</CardTitle>
          <div className="text-sm text-muted-foreground">{foodItem.brand}</div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 space-y-2">
              <Label>Amount (g/ml)</Label>
              <Input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
            <div className="text-right space-y-1 pt-6 text-sm">
              <div className="font-bold text-xl">{Math.round(calories)} kcal</div>
              <div className="text-muted-foreground">
                P: {Math.round(protein)}g • C: {Math.round(carbs)}g • F: {Math.round(fat)}g
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Add to Diary'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
