import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { searchProductsByName } from '@/lib/openfoodfacts'
import { FoodItem } from '@/types'
import { Card, CardContent } from '@/components/ui/card'

interface FoodSearchProps {
  onSelect: (item: FoodItem) => void
}

export default function FoodSearch({ onSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Simple debounce
  const handleSearch = () => {
    setDebouncedQuery(query)
  }

  const { data: results, isLoading } = useQuery({
    queryKey: ['foodSearch', debouncedQuery],
    queryFn: () => searchProductsByName(debouncedQuery),
    enabled: debouncedQuery.length > 2
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Search food (e.g. 'Apple')" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto">
        {isLoading && <div className="text-center p-4">Searching...</div>}
        
        {results?.map((item, idx) => (
          <Card key={idx} className="cursor-pointer hover:bg-accent" onClick={() => onSelect(item)}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-muted-foreground">{item.brand}</div>
              </div>
              <div className="text-right text-sm">
                <div>{Math.round(item.calories_100g)} kcal</div>
                <div className="text-xs text-muted-foreground">per 100g</div>
              </div>
            </CardContent>
          </Card>
        ))}
        {results?.length === 0 && debouncedQuery && !isLoading && (
            <div className="text-center text-muted-foreground">No results found</div>
        )}
      </div>
    </div>
  )
}
