"use client"

import { Bell, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useEffect, useState, ReactNode } from "react"
import { fetchProfile, UserProfile } from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"

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
    <header className="flex items-center justify-between gap-4 animate-slide-in-up">
      <div className="flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">{title}</h1>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-1 md:gap-1.5">
          <ThemeToggle className="static w-9 h-9 shadow-none border-none bg-transparent backdrop-blur-none hover:bg-accent" />

          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-3 pl-3 border-l border-border h-9 ml-1">
            <Avatar className="w-9 h-9 ring-2 ring-primary/10">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user ? getInitials(user.username) : <UserIcon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs hidden sm:block max-w-[150px] leading-tight">
              <p className="font-bold text-foreground truncate">
                {user ? capitalize(user.username) : "Usuario"}
              </p>
              <p className="text-muted-foreground text-[10px] truncate">
                {user ? capitalize(user.email) : "Cargando..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
