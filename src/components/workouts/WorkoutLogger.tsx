import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ACTIVITY_LABELS, ACTIVITY_METS, calculateCaloriesBurned } from '@/lib/activity'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import { useQueryClient } from '@tanstack/react-query'

interface WorkoutLoggerProps {
  onClose: () => void
  onSuccess: () => void
}

export default function WorkoutLogger({ onClose, onSuccess }: WorkoutLoggerProps) {
  const [activityType, setActivityType] = useState<string>('weightlifting_vigorous')
  const [duration, setDuration] = useState<string>('60')
  const [loading, setLoading] = useState(false)
  
  const user = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  
  // TODO: Get real weight from profile. Defaulting to 75kg if not found conceptually.
  const userWeight = 75 

  const met = ACTIVITY_METS[activityType] || 0
  const calories = calculateCaloriesBurned(met, userWeight, Number(duration))

  const handleSave = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { error } = await supabase.from('workout_logs').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        duration_minutes: Number(duration),
        calories_burned: Math.round(calories),
        // For now we don't link to a "Plan" ID in this quick logger, purely ad-hoc
        workout_id: null 
      })

      if (error) throw error
      
      queryClient.invalidateQueries({ queryKey: ['workout_logs'] })
      onSuccess()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Log Workout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Activity Type</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
            >
              {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label>Duration (minutes)</Label>
            <Input 
              type="number" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>

          <div className="pt-4 text-center">
             <div className="text-3xl font-bold text-primary">
                {Math.round(calories)} <span className="text-sm font-normal text-muted-foreground">kcal</span>
             </div>
             <div className="text-xs text-muted-foreground">Estimated based on standard METs</div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Log Workout'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
