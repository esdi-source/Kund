import { Card, CardContent } from '@/components/ui/card'
import { DiaryEntry } from '@/types'
import { Flame, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailySummaryProps {
  entries: DiaryEntry[]
  burnedCalories: number
  calorieGoal?: number
}

export default function DailySummary({ entries, burnedCalories, calorieGoal = 2000 }: DailySummaryProps) {
  // Macros goals
  const GOALS = {
    calories: calorieGoal,
    protein: 180, // High protein focus
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
  const remaining = Math.max(0, totalBudget - totals.calories)
  
  // Percentages for bars
  const pCal = Math.min(100, (totals.calories / totalBudget) * 100)
  const pPro = Math.min(100, (totals.protein / GOALS.protein) * 100)
  const pCarb = Math.min(100, (totals.carbs / GOALS.carbs) * 100)
  const pFat = Math.min(100, (totals.fat / GOALS.fat) * 100)

  return (
    <div className="space-y-4">
        {/* Main "Ring" Card - Apple Health Style */}
        <Card className="border-0 shadow-lg shadow-black/5 bg-gradient-to-br from-card to-secondary/30 overflow-hidden relative">
           {/* Decorative background blur */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />

           <CardContent className="p-6 relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                   <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Calories</h2>
                   <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-4xl font-bold font-sans tracking-tight text-foreground">{Math.round(remaining)}</span>
                      <span className="text-sm font-medium text-muted-foreground">left</span>
                   </div>
                </div>
                {burnedCalories > 0 && (
                     <div className="flex flex-col items-end animate-pulse">
                        <div className="flex items-center text-orange-500 font-bold text-sm bg-orange-500/10 px-2 py-1 rounded-full">
                            <Flame size={12} className="mr-1 fill-orange-500" />
                            {Math.round(burnedCalories)} active
                        </div>
                     </div>
                )}
              </div>

              {/* Enhanced Progress Bar */}
              <div className="relative h-6 w-full bg-secondary/50 rounded-full overflow-hidden mb-2 shadow-inner">
                  {/* Background Stripes */}
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%,rgba(0,0,0,0.02))] bg-[length:12px_12px]" />
                 
                 <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-1000 ease-out relative"
                    style={{ width: `${pCal}%` }}
                 >
                    <div className="absolute inset-0 bg-white/20" /> {/* Shine effect */}
                 </div>
              </div>
              
              <div className="flex justify-between text-xs font-medium text-muted-foreground px-1">
                  <span>0</span>
                  <span>{Math.round(totalBudget)} kcal target</span>
              </div>
           </CardContent>
        </Card>

        {/* Macros Row - iOS Widgets Style */}
        <div className="grid grid-cols-3 gap-3">
            <MacroCard 
                label="Protein" 
                current={totals.protein} 
                total={GOALS.protein} 
                color="bg-emerald-500" 
                trackColor="bg-emerald-500/20"
                percent={pPro}
            />
            <MacroCard 
                label="Carbs" 
                current={totals.carbs} 
                total={GOALS.carbs} 
                color="bg-sky-500" 
                trackColor="bg-sky-500/20"
                percent={pCarb}
            />
            <MacroCard 
                label="Fat" 
                current={totals.fat} 
                total={GOALS.fat} 
                color="bg-rose-500" 
                trackColor="bg-rose-500/20"
                percent={pFat}
            />
        </div>
    </div>
  )
}

function MacroCard({ label, current, total, color, trackColor, percent }: any) {
    return (
        <Card className="border-0 shadow-sm bg-card p-3 flex flex-col items-center justify-center text-center relative overflow-hidden">
             <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">{label}</div>
             <div className="font-bold text-lg mb-2">{Math.round(current)}<span className="text-[10px] text-muted-foreground font-normal">/{total}g</span></div>
             
             {/* Circular Progress (CSS Only) */}
             <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                 <div className={cn("h-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
             </div>
        </Card>
    )
}
