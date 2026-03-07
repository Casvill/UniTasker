"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { fetchProfile, UserProfile } from "@/lib/api"
import { User as UserIcon } from "lucide-react"

export function SettingsContent() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await fetchProfile()
        if (data) setUser(data)
      } catch (err) {
        console.error("No se pudo cargar el perfil en configuración", err)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  // Función para capitalizar la primera letra
  const capitalize = (str: string | undefined) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Información del Perfil</h3>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" alt={user?.username || "Usuario"} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {user ? getInitials(user.username) : <UserIcon className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline">Cambiar Foto</Button>
              <p className="text-xs text-muted-foreground mt-2">JPG, PNG o GIF. Tamaño máx. 2MB</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de Usuario</Label>
              <Input 
                id="name" 
                value={user ? capitalize(user.username) : ""} 
                readOnly 
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input 
                id="email" 
                type="email" 
                value={user ? capitalize(user.email) : ""} 
                readOnly 
                className="bg-muted/50"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Nota: Estos datos se sincronizan con tu cuenta principal.</p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Notificaciones</h3>
        <div className="space-y-4">
          {[
            { label: "Notificaciones por email", description: "Recibe correos sobre la actividad de tu cuenta" },
            { label: "Notificaciones push", description: "Recibe notificaciones en tu navegador" },
            { label: "Recordatorios de tareas", description: "Avisos sobre fechas límite próximas" },
            { label: "Actualizaciones de equipo", description: "Notificaciones sobre actividades de miembros" },
          ].map((item, index) => (
            <div
              key={item.label}
              className="flex items-center justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <Switch defaultChecked={index < 2} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Apariencia</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modo Oscuro</p>
              <p className="text-sm text-muted-foreground">Activar el tema oscuro</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} />
          </div>
        </div>
      </Card>
    </div>
  )
}
