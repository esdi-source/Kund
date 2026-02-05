import { Card, CardContent } from '@/components/ui/card'
import { DiaryEntry } from '@/types'
import { Flame } from 'lucide-react'

interface DailySummaryProps {
  entries: DiaryEntry[]
  burnedCalories: number
  calorieGoal?: number
}

export default function DailySummary({ entries, burnedCalories, calorieGoal = 2000 }: DailySummaryProps) {
  // Fixed macro ratio for now 50/30/20 approx or standard
  const GOALS = {
    calories: calorieGoal,
    protein: 160,
    carbs: 250,
    fat: 70
  }

  const totals = entries.reduce((acc, entry) => ({
    calories: acc.calories + entry.calories,
    protein: acc.protein + entry.protein,
    carbs: acc.carbs + entry.carbs,
    fat: acc.fat + entry.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const totalBudget = GOALS.calories + burnedCalories
  const remaining = totalBudget - totals.calories
  const progressPercent = Math.min(100, (totals.calories / totalBudget) * 100)

  return (
    <Card className="bg-card shadow-sm border-border">
      <CardContent className="p-4 space-y-4">
        {/* Calories Main Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-3xl font-bold font-mono tracking-tight">{Math.round(remaining)}</div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Kcal Left</div>
            </div>
            <div className="text-right">
                <div className="text-sm font-medium">
                    <span className="text-muted-foreground">{Math.round(totals.calories)}</span>
                    <span className="mx-1 text-muted-foreground">/</span>
                    <span>{Math.round(GOALS.calories)}</span>
                    {burnedCalories > 0 && (
                        <span className="ml-1 text-green-500 text-xs flex items-center inline-flex">
                           + <Flame size={10} className="mr-0.5" />{Math.round(burnedCalories)}
                        </span>
                    )}
                </div>
            </div>
          </div>
          <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative">
            {/* Base Progress */}
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out absolute left-0 top-0 z-10" 
              style={{ width: `${Math.min(100, (totals.calories / GOALS.calories) * 100)}%` }}
            />
            {/* Extended Budget Visualization (if burned adds to budget) could be complex, keeping it simple bar for now */}
          </div>
        </div>

        {/* Micros Grid */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          {/* Protein */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Protein</span>
              <span>{Math.round(totals.protein)}/{GOALS.protein}g</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/80 transition-all duration-500" 
                style={{ width: `${Math.min(100, (totals.protein / GOALS.protein) * 100)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Carbs</span>
              <span>{Math.round(totals.carbs)}/{GOALS.carbs}g</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/60 transition-all duration-500" 
                style={{ width: `${Math.min(100, (totals.carbs / GOALS.carbs) * 100)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Fat</span>
              <span>{Math.round(totals.fat)}/{GOALS.fat}g</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary/40 transition-all duration-500" 
                style={{ width: `${Math.min(100, (totals.fat / GOALS.fat) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
