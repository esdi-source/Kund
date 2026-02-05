import { useState } from 'react'
import { Plus, Dumbbell, History, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import WorkoutLogger from '@/components/workouts/WorkoutLogger'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format, subDays } from 'date-fns'

export default function WorkoutsPage() {
  const [showLogger, setShowLogger] = useState(false)

  // Fetch recent logs
  const { data: logs = [] } = useQuery({
    queryKey: ['workout_logs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      return data || []
    }
  })

  // Calculate weekly stats
  const weeklyCalories = logs
    .filter(l => new Date(l.date) > subDays(new Date(), 7))
    .reduce((sum, l) => sum + (l.calories_burned || 0), 0)

  return (
    <div className="flex flex-col h-full relative p-4 space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Workouts</h1>
        <Button size="icon" onClick={() => setShowLogger(true)}>
            <Plus />
        </Button>
      </header>

      {/* Stats Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardContent className="p-6 flex justify-between items-center">
            <div>
                <p className="text-primary-foreground/80 text-sm">Active Calories (7 days)</p>
                <p className="text-3xl font-bold">{Math.round(weeklyCalories)}</p>
            </div>
            <TrendingUp size={40} className="opacity-50" />
        </CardContent>
      </Card>

      {/* Plans Section (Placeholder for now) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">My Plans</h2>
            <Button variant="link" className="text-sm h-auto p-0">Manage</Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <Card className="bg-secondary/20 border-dashed border-2 flex items-center justify-center h-32 cursor-pointer hover:bg-secondary/40 transition-colors">
                <div className="text-center text-muted-foreground">
                    <Plus className="mx-auto mb-2" />
                    Create Plan
                </div>
            </Card>
            <Card className="p-4 flex flex-col justify-between h-32 cursor-pointer hover:border-primary transition-colors">
                <Dumbbell className="text-primary" />
                <div>
                    <div className="font-bold">Push Day</div>
                    <div className="text-xs text-muted-foreground">Chest, Shoulders, Triceps</div>
                </div>
            </Card>
        </div>
      </div>

      {/* History Section */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Recent History</h2>
        {logs.length === 0 ? (
            <div className="text-muted-foreground text-sm italic text-center py-8">
                No workouts logged yet. Go lift something!
            </div>
        ) : (
            <div className="space-y-2">
                {logs.map((log: any) => (
                    <Card key={log.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent p-2 rounded-full">
                                <History size={16} />
                            </div>
                            <div>
                                <div className="font-medium">Workout</div>
                                <div className="text-xs text-muted-foreground">{format(new Date(log.date), 'MMM d, yyyy')}</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold">{log.calories_burned} kcal</div>
                            <div className="text-xs text-muted-foreground">{log.duration_minutes} min</div>
                        </div>
                    </Card>
                ))}
            </div>
        )}
      </div>

      {showLogger && (
        <WorkoutLogger 
            onClose={() => setShowLogger(false)} 
            onSuccess={() => setShowLogger(false)} 
        />
      )}
    </div>
  )
}
