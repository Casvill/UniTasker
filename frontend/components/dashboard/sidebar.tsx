"use client"

import { ListTodo, Calendar, Settings, HelpCircle, LogOut, BookCheck, ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api"

const menuItems = [
  { icon: ListTodo, label: "Hoy", href: "/today" },
  { icon: BookCheck, label: "Actividades", href: "/tasks" },
  { icon: Calendar, label: "Calendario", href: "/calendar" },

]

const generalItems = [
  { icon: Settings, label: "Configuración", href: "/settings" },
  { icon: LogOut, label: "Cerrar Sesion", href: "/logout" },
]

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  className?: string; 
  onClose?: () => void;
}

type CalendarDaySummary = {
  day: number
  count: number
  hasConflict: boolean
}

export function Sidebar({ isCollapsed, setIsCollapsed, className, onClose }: SidebarProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [conflictDays, setConflictDays] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    let active = true

    async function loadConflictDays() {
      try {
        const today = new Date()
        const month = today.getMonth() + 1
        const year = today.getFullYear()

        const data = await apiFetch<CalendarDaySummary[]>(
          `/tareas/calendario-mensual/?month=${month}&year=${year}`
        )

        if (active) {
          setConflictDays(data.filter((day) => day.hasConflict).length)
        }
      } catch (error) {
        console.error("No se pudo cargar el resumen de conflictos", error)
        if (active) setConflictDays(0)
      }
    }

    loadConflictDays()

    const handleLimitUpdate = () => {
      if (active) {
        loadConflictDays() 
      }
    }

    window.addEventListener('dailyLimitUpdated', handleLimitUpdate)

    return () => {
      active = false
      window.removeEventListener('dailyLimitUpdated', handleLimitUpdate)
    }
  }, [])

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-card border-r border-border p-4 transition-all duration-500 z-40",
        isCollapsed ? "w-22" : "w-64", 
        className
      )}    
    >
      <div className="flex items-center gap-2 mb-6 group cursor-pointer">

        <Link href="/today" className="flex items-center gap-2 relative h-10 w-full">
          <div className="relative h-10 w-full flex items-center">
            <Image
              src="/unitasker.svg"
              alt="UniTasker"
              width={180}
              height={40}
              className={cn("block dark:hidden absolute left-0", isCollapsed ? "opacity-0" : "opacity-100")}
              style={{
                clipPath: isCollapsed ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
                transition: "clip-path 300ms ease, opacity 200ms ease",
                transitionDelay: isCollapsed ? "0ms" : "200ms" 
              }}
              priority
            />

            <Image
              src="/unitaskerhide.svg"
              alt="UniTasker collapsed"
              width={50}
              height={50}
              className={cn("block dark:hidden absolute left-0", isCollapsed ? "opacity-100" : "opacity-0")}
              style={{
                clipPath: isCollapsed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                transition: "clip-path 0ms ease, opacity 0ms ease",
                transitionDelay: isCollapsed ? "0ms" : "400ms" 
              }}
              priority
            />

            {/* Dark - expanded (barrido hacia la izquierda al ocultar) */}
            <Image
              src="/unitaskerv2.svg"
              alt="UniTasker dark"
              width={180}
              height={40}
              className={cn("hidden dark:block absolute left-0", isCollapsed ? "opacity-0" : "opacity-100")}
              style={{
                clipPath: isCollapsed ? "inset(0 100% 0 0)" : "inset(0 0 0 0)",
                transition: "clip-path 300ms ease, opacity 200ms ease",
                transitionDelay: isCollapsed ? "0ms" : "200ms"
              }}
              priority
            />

            {/* Dark - collapsed (aparece con barrido desde la derecha) */}
            <Image
              src="/unitaskerv2hide.svg"
              alt="UniTasker dark collapsed"
              width={50}
              height={50}
              className={cn("hidden dark:block absolute left-0", isCollapsed ? "opacity-100" : "opacity-0")}
              style={{
                clipPath: isCollapsed ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
                transition: "clip-path 0ms ease, opacity 0ms ease",
                transitionDelay: isCollapsed ? "0ms" : "400ms"
              }}
              priority
            />
          </div>
        </Link>
        <button 
          onClick={() => (onClose ? onClose() : setIsCollapsed(!isCollapsed))}
          className="absolute -right-4 top-8 z-50 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-md hover:bg-secondary transition-all"
        >
          <ChevronLeft 
            className={cn(
              "h-6 w-6 transition-transform duration-500",
              isCollapsed && "rotate-180" // Gira si está colapsado
            )} 
          />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">Menu</p>
          <nav className="space-y-0.5">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !isActive && "translate-x-1",
                  )}
                >
                  <item.icon className="w-5 h-5 ml-2" />
                  <span
                    className={cn(
                      "text-sm overflow-hidden whitespace-nowrap transition-all duration-300",
                      isCollapsed ? "max-w-0 opacity-0" : "max-w-[160px] opacity-100 delay-200"
                    )}
                  >
                    {item.label}
                  </span>

                  {item.label === "Calendario" && conflictDays > 0 && !isCollapsed && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">
                      {conflictDays}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div>
          <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">General</p>
          <nav className="space-y-0.5">
            {generalItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.label)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "w-full flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !isActive && "translate-x-1",
                  )}
                >
                  <item.icon className="w-5 h-5 ml-2" />
                  <span
                    className={cn(
                      "text-sm overflow-hidden whitespace-nowrap transition-all duration-300",
                      isCollapsed
                        ? "max-w-0 opacity-0"
                        : "max-w-[160px] opacity-100 delay-200"
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
