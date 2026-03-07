"use client"

import { ListTodo, Calendar, Settings, HelpCircle, LogOut, BookCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

const menuItems = [
  { icon: ListTodo, label: "Hoy", href: "/today" },
  { icon: BookCheck, label: "Actividades", href: "/tasks" },
  { icon: Calendar, label: "Calendario", href: "/calendar" },

]

const generalItems = [
  { icon: Settings, label: "Configuracion", href: "/settings" },
  { icon: HelpCircle, label: "Ayuda", href: "/help" },
  { icon: LogOut, label: "Cerrar Sesion", href: "/logout" },
]

export function Sidebar() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const pathname = usePathname()

  return (
    <aside className="fixed top-0 left-0 w-64 bg-card border-r border-border p-4 h-screen overflow-y-auto lg:block">
      <div className="flex items-center gap-2 mb-6 group cursor-pointer">
        <Link href="/today" className="flex items-center gap-2">
          {/* Logo claro para modo claro */}
          <Image
            src="/unitasker.svg"
            alt="UniTasker"
            width={180}
            height={180}
            className="block dark:hidden transition-all duration-300"
            priority
          />
          {/* Logo oscuro para modo oscuro */}
          <Image
            src="/unitaskerv2.svg"
            alt="UniTasker dark"
            width={180}
            height={180}
            className="hidden dark:block transition-all duration-300"
            priority
          />
        </Link>
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
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !isActive && "translate-x-1",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
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
                    "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-300",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    hoveredItem === item.label && !isActive && "translate-x-1",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </aside>
  )
}
