"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, AlertCircle, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { apiFetch, setTokens } from "@/lib/api"
import { useTheme } from "next-themes"

export function LoginForm() {
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<{ access: string; refresh: string }>("/token/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      setTokens(data.access, data.refresh, email, remember)
      router.push("/today")
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "Error al iniciar sesión. Por favor, verifica tus credenciales.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen relative">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-primary-foreground" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border-2 border-primary-foreground" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full border-2 border-primary-foreground" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <h1 className="text-4xl font-bold text-primary-foreground mb-4 text-balance">
            Organiza tus actividades sin estrés
          </h1>
          <p className="text-primary-foreground/70 text-lg leading-relaxed">
            Planifica exámenes, talleres y proyectos en un solo lugar.
          </p>

          <div className="mt-12 flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-foreground">12k+</p>
              <p className="text-sm text-primary-foreground/60">Usuarios activos</p>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-foreground">98%</p>
              <p className="text-sm text-primary-foreground/60">Satisfaccion</p>
            </div>
            <div className="w-px h-12 bg-primary-foreground/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-primary-foreground">50k+</p>
              <p className="text-sm text-primary-foreground/60">Actividades completadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-center mb-10">
            {/* Logo dinámico según el tema */}
            <Image
              src="/unitasker.svg"
              alt="Logo UniTasker"
              width={300}
              height={300}
              priority
              className="w-24 md:w-32 lg:w-48 h-auto drop-shadow-xl block dark:hidden"
            />
            <Image
              src="/unitaskerv2.svg"
              alt="Logo UniTasker Dark"
              width={300}
              height={300}
              priority
              className="w-24 md:w-32 lg:w-48 h-auto drop-shadow-xl hidden dark:block"
            />
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">Bienvenido de nuevo</h2>
            <p className="text-muted-foreground mt-1">Accede a tu espacio personal y continúa organizando tus actividades.</p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electronico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(checked) => setRemember(checked === true)}
              />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                Mantener sesión iniciada por 30 días
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-medium",
                isLoading && "opacity-80"
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Iniciando sesion...
                </span>
              ) : (
                "Iniciar sesion"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {"¿No tienes una cuenta? "}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
