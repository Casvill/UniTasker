"use client"

import { Search, Mail, Bell, Moon, Sun, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useEffect, useState, ReactNode } from "react"
import { fetchProfile, UserProfile } from "@/lib/api"

interface HeaderProps {
  title: string
  description: string
  actions?: ReactNode
}

export function Header({ title, description, actions }: HeaderProps) {
  const { theme, setTheme } = useTheme()
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

  return (
    <header className="space-y-3 md:space-y-4 animate-slide-in-up">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              className="pl-9 pr-3 md:pr-16 h-9 text-sm bg-card border-border transition-all duration-300 focus:shadow-lg focus:shadow-primary/10"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-secondary h-8 w-8"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          )}
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Bell className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Avatar className="w-8 h-8 ring-2 ring-primary/10">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {user ? getInitials(user.username) : <UserIcon className="w-4 h-4" />}
              </AvatarFallback>
            </Avatar>
            <div className="text-xs hidden sm:block max-w-[150px]">
              {/* Nombre de usuario con primera letra en mayúscula */}
              <p className="font-bold text-foreground truncate">
                {user ? capitalize(user.username) : "Usuario"}
              </p>
              {/* Correo con primera letra en mayúscula */}
              <p className="text-muted-foreground text-[10px] truncate">
                {user ? capitalize(user.email) : "Cargando..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">{title}</h1>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </header>
  )
}
