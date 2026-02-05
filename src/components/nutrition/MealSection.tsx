import { DiaryEntry } from '@/types'
import { Card } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'

interface MealSectionProps {
  title: string
  entries: DiaryEntry[]
  onAdd: () => void
  date: string
}

export default function MealSection({ title, entries, onAdd, date }: MealSectionProps) {
  const queryClient = useQueryClient()

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this entry?')) return

    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('id', id)

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['diary', date] })
    }
  }

  const mealCalories = entries.reduce((sum, e) => sum + e.calories, 0)

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-end px-4 mb-2">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">{title}</h3>
        <span className="text-xs font-semibold text-foreground bg-secondary px-2 py-0.5 rounded-md">
            {Math.round(mealCalories)} kcal
        </span>
      </div>
      
      <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
        <div className="divide-y divide-border/40">
          {entries.map((entry) => (
            <div 
                key={entry.id} 
                className="p-3.5 flex justify-between items-center active:bg-secondary/50 transition-colors cursor-default"
                onClick={() => {}}
            >
              <div className="flex-1 min-w-0 pr-3">
                <div className="font-semibold text-sm leading-tight text-foreground">
                    {entry.food_item?.name || 'Unknown Item'}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">
                    {entry.amount_g}g <span className="mx-1">·</span> {Math.round(entry.calories)} kcal
                </div>
              </div>
              <div className="flex items-center">
                 {/* Nutrient pills */}
                 <div className="hidden sm:flex items-center gap-1 mr-3 text-[10px] font-bold text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
                    <span className="text-blue-500">{Math.round(entry.protein)}P</span>
                    <span className="text-orange-500">{Math.round(entry.carbs)}C</span>
                    <span className="text-red-500">{Math.round(entry.fat)}F</span>
                 </div>

                <Button
                    variant="ghost" 
                    size="icon"
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="h-7 w-7 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 -mr-2"
                >
                    <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
          
          <button 
            className="w-full py-3.5 text-center text-primary font-medium text-sm hover:bg-primary/5 active:bg-primary/10 transition-colors flex items-center justify-center gap-1 group"
            onClick={onAdd}
          >
            <Plus size={16} className="transition-transform group-active:scale-110" /> Add Food
          </button>
        </div>
      </div>
    </div>
  )
}
