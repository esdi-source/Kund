import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface RecipeListProps {
  onCreateNew: () => void
  onSelect: (recipe: any) => void
}

export default function RecipeList({ onCreateNew, onSelect }: RecipeListProps) {
  const user = useAuthStore(s => s.user)

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('brand', 'My Recipes')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as any[] 
    },
    enabled: !!user
  })

  if (isLoading) return <div className="p-4 text-center">Loading recipes...</div>

  return (
    <div className="space-y-4">
      <Button onClick={onCreateNew} className="w-full" variant="outline">
        <Plus className="mr-2 h-4 w-4" /> Create New Recipe
      </Button>

      <div className="grid gap-2">
        {recipes?.map((recipe) => (
          <Card key={recipe.id} className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer" onClick={() => onSelect(recipe)}>
            <div>
                <h3 className="font-semibold">{recipe.name}</h3>
                <div className="text-xs text-muted-foreground">
                    {Math.round(recipe.calories_100g)} kcal/100g
                </div>
            </div>
            <Button size="icon" variant="ghost">
                <Plus className="h-4 w-4" />
            </Button>
          </Card>
        ))}
        {recipes?.length === 0 && (
            <div className="text-center p-8 text-muted-foreground">
                No recipes created yet.
            </div>
        )}
      </div>
    </div>
  )
}
