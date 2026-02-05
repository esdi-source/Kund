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
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="text-sm font-medium text-muted-foreground">{Math.round(mealCalories)} kcal</div>
      </div>
      
      <Card className="overflow-hidden border-none shadow-none bg-secondary/20">
        <div className="divide-y divide-border/50">
          {entries.map(entry => (
            <div 
                key={entry.id} 
                className="p-3 flex justify-between items-center bg-card hover:bg-accent/50 transition-colors"
                onClick={() => {}}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-medium truncate">
                    {entry.food_item?.name || 'Unknown Item'}
                </div>
                <div className="text-xs text-muted-foreground">
                    {entry.amount_g}g • {Math.round(entry.protein)}P {Math.round(entry.carbs)}C {Math.round(entry.fat)}F
                </div>
              </div>
              <div className="flex items-center gap-3 pl-2">
                <span className="font-semibold text-sm">{Math.round(entry.calories)}</span>
                <button 
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {entries.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground italic">
                No food logged
            </div>
          )}

          <Button 
            variant="ghost" 
            className="w-full rounded-none h-10 text-primary hover:text-primary hover:bg-primary/10"
            onClick={onAdd}
          >
            <Plus size={16} className="mr-2" /> Add Food
          </Button>
        </div>
      </Card>
    </div>
  )
}
