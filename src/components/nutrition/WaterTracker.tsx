import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Minus, Droplets } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

interface WaterTrackerProps {
  date: string
}

export default function WaterTracker({ date }: WaterTrackerProps) {
  const queryClient = useQueryClient()
  
  const { data: waterLogs } = useQuery({
    queryKey: ['water', date],
    queryFn: async () => {
      const { data } = await supabase
        .from('water_entries')
        .select('amount_ml')
        .eq('date', date)
      
      return data || []
    }
  })

  const totalWater = waterLogs?.reduce((sum, entry) => sum + entry.amount_ml, 0) || 0
  const GOAL = 2500 // ml

  const addWater = useMutation({
    mutationFn: async (amount: number) => {
        // Optimistic update could be done here, but simple mutation is fine for now
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (amount > 0) {
            await supabase.from('water_entries').insert({
                user_id: user.id,
                date,
                amount_ml: amount
            })
        } else {
            // Logic to remove latest entry or specific amount is complex with just INSERTs.
            // For simplicity in this "Input Efficiency" app, we just insert negative values to subtract?
            // Or better: Delete the last entry.
            const { data: lastEntry } = await supabase
                .from('water_entries')
                .select('id')
                .eq('date', date)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()
            
            if (lastEntry) {
                await supabase.from('water_entries').delete().eq('id', lastEntry.id)
            }
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['water', date] })
    }
  })

  return (
    <Card className="border-0 shadow-sm bg-blue-50/50 dark:bg-blue-950/20 overflow-hidden">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-full">
                <Droplets className="text-blue-500 fill-blue-500" size={20} />
            </div>
            <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Water Intake</div>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{(totalWater / 1000).toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground font-medium">/ {(GOAL / 1000).toFixed(1)} L</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 shadow-sm rounded-full active:scale-95 transition-transform"
                onClick={() => addWater.mutate(-250)}
                disabled={totalWater <= 0}
            >
                <Minus size={18} />
            </Button>
            <Button 
                size="icon" 
                className="h-10 w-10 bg-blue-500 hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 rounded-full active:scale-95 transition-transform"
                onClick={() => addWater.mutate(250)}
            >
                <Plus size={18} />
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
