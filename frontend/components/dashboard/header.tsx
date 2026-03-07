"use client"

import { Bell, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState, ReactNode } from "react"
import { fetchProfile, UserProfile } from "@/lib/api"
import { MobileNav } from "./mobile-nav"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    setMounted(true)
    async function loadUser() {
      try {
        const data = await fetchProfile()
        if (data) setUser(data)
      } catch (err) {
        console.error("No se pudo cargar el perfil", err)
      }
    }
    loadUser()
  }, [])

  // Función para capitalizar la primera letra
  const capitalize = (str: string | undefined) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  if (!mounted) return null

  return (
    <header className="flex flex-col gap-4 animate-slide-in-up sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="lg:hidden shrink-0">
          <MobileNav />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold text-foreground truncate">{title}</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-2 md:gap-3 shrink-0">
        {actions && (
          <div className="flex items-center gap-2 mr-2 border-r pr-2 border-border hidden sm:flex">
            {actions}
          </div>
        )}
        <div className="flex items-center gap-1 md:gap-1.5 ml-auto sm:ml-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9">
            <Bell className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-3 border-l border-border h-8 md:h-9 ml-1">
            <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-primary/10">
              <AvatarFallback className="text-[10px] md:text-xs bg-primary/10 text-primary">
                {user ? getInitials(user.username) : <UserIcon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-[10px] md:text-xs hidden sm:block max-w-[120px] md:max-w-[150px] leading-tight">
              <p className="font-bold text-foreground truncate">
                {user ? capitalize(user.username) : "Usuario"}
              </p>
              <p className="text-muted-foreground opacity-70 truncate">
                {user ? user.email : "Cargando..."}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile actions row */}
      {actions && (
        <div className="flex items-center gap-2 sm:hidden overflow-x-auto pb-1 no-scrollbar">
          {actions}
        </div>
      )}
    </header>
  )
}
