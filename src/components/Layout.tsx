import { Outlet, NavLink } from 'react-router-dom'
import { Home, Utensils, Dumbbell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 pb-16 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center h-16 safe-area-bottom">
        <NavLink 
          to="/" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full text-xs gap-1 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
          )}
        >
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        
        <NavLink 
          to="/nutrition" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full text-xs gap-1 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
          )}
        >
          <Utensils size={24} />
          <span>Nutrition</span>
        </NavLink>
        
        <NavLink 
          to="/workouts" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full text-xs gap-1 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
          )}
        >
          <Dumbbell size={24} />
          <span>Workouts</span>
        </NavLink>
        
        <NavLink 
          to="/profile" 
          className={({ isActive }) => cn(
            "flex flex-col items-center justify-center w-full h-full text-xs gap-1 transition-colors",
            isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
          )}
        >
          <User size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  )
}
