"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import {
  fetchProfile,
  fetchDailyLimit,
  updateDailyLimit,
  UserProfile,
} from "@/lib/api"
import { User as UserIcon, Loader2} from "lucide-react"
import { CircleAlert } from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"

export function SettingsContent() {
  const { theme, setTheme } = useTheme()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [dailyLimit, setDailyLimit] = useState("6")
  const [savedDailyLimit, setSavedDailyLimit] = useState("6")
  const [capacityError, setCapacityError] = useState("")
  const [isSavingCapacity, setIsSavingCapacity] = useState(false)
  const [isLoadingCapacity, setIsLoadingCapacity] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, dailyLimitData] = await Promise.all([
          fetchProfile(),
          fetchDailyLimit(),
        ])

        if (profileData) setUser(profileData)

        const currentLimit = String(dailyLimitData?.daily_hour_limit ?? 6)
        setDailyLimit(currentLimit)
        setSavedDailyLimit(currentLimit)
      } catch (err) {
        console.error("No se pudo cargar la configuración", err)
        toast.error("No se pudo cargar la configuración del usuario.")
      } finally {
        setLoading(false)
        setIsLoadingCapacity(false)
      }
    }

    loadData()
  }, [])

  const capitalize = (str: string | undefined) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase()
  }

  const validateDailyLimit = (value: string) => {
    if (!value.trim()) return "El límite debe estar entre 1 y 16 horas."

    const parsed = Number(value)

    if (!Number.isInteger(parsed)) {
      return "Ingresa un número entero válido."
    }

    if (parsed < 1 || parsed > 16) {
      return "El límite debe estar entre 1 y 16 horas."
    }

    return ""
  }

  const handleSaveDailyLimit = async () => {
    const errorMessage = validateDailyLimit(dailyLimit)
    setCapacityError(errorMessage)

    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    try {
      setIsSavingCapacity(true)

      const data = await updateDailyLimit(Number(dailyLimit))

      const updatedLimit = String(data?.daily_hour_limit ?? dailyLimit)
      setDailyLimit(updatedLimit)
      setSavedDailyLimit(updatedLimit)
      setCapacityError("")

      toast.success("Límite actualizado correctamente")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo guardar el límite."

      setCapacityError(message)
      toast.error(message)
    } finally {
      setIsSavingCapacity(false)
    }
  }

  const hasChanges = dailyLimit !== savedDailyLimit

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Tu perfil</h3>
        <div className="space-y-6">
          {/* <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="" alt={user?.username || "Usuario"} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {user ? getInitials(user.username) : <UserIcon className="w-8 h-8" />}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button variant="outline">Actualizar foto</Button>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG o GIF. Tamaño máx. 2MB
              </p>
            </div>
          </div> */}

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
                value={user ? user.email : ""}
                readOnly
                className="bg-muted/50"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Nota: Estos datos se sincronizan con tu cuenta principal.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-2">Capacidad diaria</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configura cuántas horas al día puedes dedicar a tus actividades. Este valor
          se usará para detectar sobrecarga según tu planificación.
        </p>

        <div className="space-y-4">
          <div className="space-y-2 max-w-sm">
            <div className="inline-flex items-center gap-1 mb-1">
              <Label htmlFor="daily-limit">Límite de horas por día</Label>
              <span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-pointer align-middle"><CircleAlert className="inline w-4 h-4 text-muted-foreground mb-1 ml-0.5" /></span>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="center" className="xs">
                      Ingresa un valor entre 1 y 16 horas. Si no hay uno guardado, se usa 6 horas por defecto.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </div>
            <div className="relative">
              <Input
                id="daily-limit"
                type="number"
                min={1}
                max={16}
                step={1}
                value={isLoadingCapacity ? "" : dailyLimit}
                onChange={(e) => {
                  setDailyLimit(e.target.value)
                  if (capacityError) setCapacityError("")
                }}
                disabled={isSavingCapacity || isLoadingCapacity}
                aria-invalid={!!capacityError}
                // className={isLoadingCapacity ? "pr-10" : ""}
              />
              {isLoadingCapacity && (
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground pointer-events-none" />
              )}
            </div>

            {capacityError && (
              <p className="text-sm text-destructive">{capacityError}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveDailyLimit}
              disabled={isSavingCapacity || isLoadingCapacity || !hasChanges}
            >
              {isSavingCapacity ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>

            {isLoadingCapacity ? (
              <p className="text-sm text-muted-foreground">Cargando límite actual...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Límite actual: <span className="font-medium">{savedDailyLimit} h/día</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/*
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
      */}

      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-6">Apariencia</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Modo Oscuro</p>
              <p className="text-sm text-muted-foreground">Activar el tema oscuro</p>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}