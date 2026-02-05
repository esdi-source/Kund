import { useState } from 'react'
import { Plus, ScanLine, Search, ChevronLeft, ChevronRight, ChefHat, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import BarcodeScanner from '@/components/nutrition/BarcodeScanner'
import FoodSearch from '@/components/nutrition/FoodSearch'
import FoodEntryDialog from '@/components/nutrition/FoodEntryDialog'
import DailySummary from '@/components/nutrition/DailySummary'
import MealSection from '@/components/nutrition/MealSection'
import WaterTracker from '@/components/nutrition/WaterTracker'
import RecipeCreator from '@/components/nutrition/RecipeCreator'
import RecipeList from '@/components/nutrition/RecipeList'
import { FoodItem, DiaryEntry } from '@/types'
import { fetchProductByBarcode } from '@/lib/openfoodfacts'
import { format, addDays, subDays } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

type Tab = 'overview' | 'search' | 'scan' | 'create-recipe'

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [searchTab, setSearchTab] = useState<'search' | 'recipes'>('search')
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null)
  const [navDate, setNavDate] = useState(new Date())
  const [targetMeal, setTargetMeal] = useState<string>('breakfast')

  const currentDateString = format(navDate, 'yyyy-MM-dd')

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['diary', currentDateString],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diary_entries')
        .select(`
          *,
          food_item:food_items(*)
        `)
        .eq('date', currentDateString)
      
      if (error) throw error
      return data as DiaryEntry[]
    }
  })

  // Fetch burned calories for today
  const { data: burnedCalories = 0 } = useQuery({
    queryKey: ['workout_logs_sum', currentDateString],
    queryFn: async () => {
        const { data } = await supabase
            .from('workout_logs')
            .select('calories_burned')
            .eq('date', currentDateString)
        
        return data?.reduce((sum, log) => sum + (log.calories_burned || 0), 0) || 0
    }
  })

  const { data: userProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null
        const { data } = await supabase.from('profiles').select('daily_calorie_target').eq('id', user.id).single()
        return data
    }
  })

  // Scan handler
  const handleScan = async (barcode: string) => {
    const product = await fetchProductByBarcode(barcode)
    if (product) {
      setSelectedFood(product)
    } else {
      alert('Product not found')
    }
  }

  const handleAddFood = (meal: string) => {
    setTargetMeal(meal)
    setActiveTab('search')
  }

  const getEntriesForMeal = (meal: string) => entries.filter(e => e.meal_type === meal)

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        <header className="flex justify-between items-center mb-2">
          <Button variant="ghost" size="icon" onClick={() => setNavDate(d => subDays(d, 1))}>
            <ChevronLeft size={20} />
          </Button>
          <div className="font-semibold text-lg flex flex-col items-center">
             <span>{format(navDate, 'EEEE')}</span>
             <span className="text-xs text-muted-foreground font-normal">{format(navDate, 'd MMM yyyy')}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setNavDate(d => addDays(d, 1))}>
            <ChevronRight size={20} />
          </Button>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <DailySummary 
                entries={entries} 
                burnedCalories={burnedCalories}
                calorieGoal={userProfile?.daily_calorie_target || 2000}
            />
            
            <WaterTracker date={currentDateString} />

            <div className="space-y-6">
                <MealSection 
                    title="Breakfast" 
                    entries={getEntriesForMeal('breakfast')} 
                    onAdd={() => handleAddFood('breakfast')}
                    date={currentDateString}
                />
                <MealSection 
                    title="Lunch" 
                    entries={getEntriesForMeal('lunch')} 
                    onAdd={() => handleAddFood('lunch')}
                    date={currentDateString}
                />
                <MealSection 
                    title="Dinner" 
                    entries={getEntriesForMeal('dinner')} 
                    onAdd={() => handleAddFood('dinner')}
                    date={currentDateString}
                />
                <MealSection 
                    title="Snacks" 
                    entries={getEntriesForMeal('snack')} 
                    onAdd={() => handleAddFood('snack')}
                    date={currentDateString}
                />
            </div>
          </div>
        )}

        {activeTab === 'scan' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setActiveTab('overview')} className="mb-2">
                ← Back
                </Button>
                <span className="font-semibold pb-2">Adding to {targetMeal}</span>
            </div>
            <BarcodeScanner onScanSuccess={handleScan} />
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <Button variant="ghost" onClick={() => setActiveTab('overview')}>
                    ← Back
                </Button>
                
                <div className="flex bg-muted rounded-md p-1">
                    <button 
                        className={`px-3 py-1 text-xs rounded-sm ${searchTab === 'search' ? 'bg-background shadow-sm' : ''}`}
                        onClick={() => setSearchTab('search')}
                    >
                        Search
                    </button>
                    <button 
                        className={`px-3 py-1 text-xs rounded-sm ${searchTab === 'recipes' ? 'bg-background shadow-sm' : ''}`}
                        onClick={() => setSearchTab('recipes')}
                    >
                        Recipes
                    </button>
                </div>

                <Button variant="outline" size="sm" onClick={() => setActiveTab('scan')}>
                    <ScanLine className="mr-2 h-4 w-4" /> Scan
                </Button>
            </div>
            
            {searchTab === 'search' ? (
                <FoodSearch onSelect={setSelectedFood} />
            ) : (
                <RecipeList 
                    onCreateNew={() => setActiveTab('create-recipe')} 
                    onSelect={setSelectedFood}
                />
            )}
          </div>
        )}

        {activeTab === 'create-recipe' && (
            <RecipeCreator 
                onBack={() => {
                    setActiveTab('search')
                    setSearchTab('recipes')
                }}
                onComplete={() => {
                    setActiveTab('search')
                    setSearchTab('recipes')
                }}
            />
        )}
      </div>

      {selectedFood && (
        <FoodEntryDialog 
            foodItem={selectedFood} 
            onClose={() => {
                setSelectedFood(null)
                setActiveTab('overview') 
            }}
            date={currentDateString}
            mealType={targetMeal}
        />
      )}
    </div>
  )
}
