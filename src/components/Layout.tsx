import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Utensils, Dumbbell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary selection:text-white">
      {/* 
         Main Content Area
         - Added safe-area-top padding to avoid notch
         - Added padding-bottom to avoid being behind the floating dock
      */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* 
         iOS Style Tab Bar 
         - Translucent blur effect (Glassmorphism)
         - Safe area handling
         - Top border very subtle
      */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/40 pb-[env(safe-area-inset-bottom)] pt-2 h-[calc(3.5rem+env(safe-area-inset-bottom))] shadow-lg shadow-black/5">
        <div className="flex justify-around items-center h-full px-2">
          <NavItem to="/" icon={Home} label="Today" isActive={pathname === '/'} />
          <NavItem to="/nutrition" icon={Utensils} label="Nutrition" isActive={pathname === '/nutrition'} />
          <NavItem to="/workouts" icon={Dumbbell} label="Workouts" isActive={pathname === '/workouts'} />
          <NavItem to="/profile" icon={User} label="Profile" isActive={pathname === '/profile'} />
        </div>
      </nav>
    </div>
  )
}

function NavItem({ to, icon: Icon, label, isActive }: { to: string, icon: any, label: string, isActive: boolean }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "group flex flex-col items-center justify-center w-16 gap-1 transition-all duration-300",
        isActive ? "scale-105" : "hover:opacity-70 active:scale-95"
      )}
    >
      <div className={cn(
        "relative p-1 rounded-xl transition-colors duration-300",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        <Icon 
            size={24}   
            strokeWidth={isActive ? 2.5 : 2} 
            className="transition-all"
        />
        {/* Active Indicator dot optional, keeping it clean for now */}
      </div>
      <span className={cn(
        "text-[10px] font-medium tracking-wide transition-colors duration-300",
        isActive ? "text-primary" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </NavLink>
  )
}
