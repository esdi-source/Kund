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
    <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full text-blue-600 dark:text-blue-400">
                <Droplets size={20} />
            </div>
            <div>
                <div className="font-bold text-lg">{totalWater} <span className="text-sm font-normal text-muted-foreground">/ {GOAL} ml</span></div>
                <div className="h-2 w-24 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden mt-1">
                    <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${Math.min(100, (totalWater / GOAL) * 100)}%` }} 
                    />
                </div>
            </div>
        </div>
        
        <div className="flex gap-2">
            <Button 
                size="icon" 
                variant="outline" 
                className="h-8 w-8 rounded-full"
                onClick={() => addWater.mutate(-250)}
            >
                <Minus size={14} />
            </Button>
            <Button 
                size="sm" 
                className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => addWater.mutate(250)}
            >
                <Plus size={14} className="mr-1" /> 250ml
            </Button>
        </div>
      </CardContent>
    </Card>
  )
}
