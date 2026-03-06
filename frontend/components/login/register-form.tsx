"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, Check, AlertCircle, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { apiFetch } from "@/lib/api"
import { useTheme } from "next-themes"

const passwordRequirements = [
    { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
    { label: "Al menos una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Al menos un número", test: (p: string) => /\d/.test(p) },
    { label: "Al menos un carácter especial", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
]

export function RegisterForm() {
    const router = useRouter()
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [passwordFocused, setPasswordFocused] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
    const allRequirementsMet = passwordRequirements.every((req) => req.test(password))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!allRequirementsMet || !passwordsMatch) return
        setIsLoading(true)
        setError(null)

        try {
            await apiFetch("/usuarios/", {
                method: "POST",
                body: JSON.stringify({
                    username: name.replace(/\s+/g, "_").toLowerCase(),
                    email: email,
                    password: password
                }),
            })
            router.push("/login?registered=true")
        } catch (err: any) {
            console.error("Registration error:", err)
            setError(err.message || "Error al crear la cuenta. Inténtalo de nuevo.")
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
                        Comienza a organizar tu semestre hoy
                    </h1>
                    <p className="text-primary-foreground/70 text-lg leading-relaxed">
                        Planifica tus actividades evaluativas, divide tus tareas y cumple tus fechas sin estrés.
                    </p>

                    <div className="mt-12 grid grid-cols-3 gap-4">
                        <div className="rounded-xl bg-primary-foreground/10 p-4">
                            <p className="text-2xl font-bold text-primary-foreground">Gratis</p>
                            <p className="text-xs text-primary-foreground/60 mt-1">Sin costo para estudiantes</p>
                        </div>
                        <div className="rounded-xl bg-primary-foreground/10 p-4">
                            <p className="text-2xl font-bold text-primary-foreground">Rápido</p>
                            <p className="text-xs text-primary-foreground/60 mt-1">Crea tu primer plan rápidamente</p>
                        </div>
                        <div className="rounded-xl bg-primary-foreground/10 p-4">
                            <p className="text-2xl font-bold text-primary-foreground">24/7</p>
                            <p className="text-xs text-primary-foreground/60 mt-1">Accede desde cualquier lugar</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right panel - Register form */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
                <div className="w-full max-w-md space-y-6">
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
                        <h2 className="text-2xl font-bold text-foreground">Crea tu cuenta</h2>
                        <p className="text-muted-foreground mt-1">Empieza a planificar tus actividades académicas de forma organizada.</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre completo</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Juan Pérez"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>

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
                            <Label htmlFor="password">Constraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Crea una contraseña segura"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
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
                            {(passwordFocused || password.length > 0) && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                                    {passwordRequirements.map((req) => (
                                        <div key={req.label} className="flex items-center gap-1.5">
                                            <div
                                                className={cn(
                                                    "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors",
                                                    req.test(password) ? "bg-primary" : "bg-muted"
                                                )}
                                            >
                                                <Check className={cn("w-2.5 h-2.5", req.test(password) ? "text-primary-foreground" : "text-muted-foreground")} />
                                            </div>
                                            <span className={cn("text-xs", req.test(password) ? "text-foreground" : "text-muted-foreground")}>
                                                {req.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirma contraseña</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Repite tu contraseña"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={cn(
                                        "pl-10 pr-10",
                                        confirmPassword.length > 0 && !passwordsMatch && "border-destructive focus-visible:ring-destructive"
                                    )}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading || !allRequirementsMet || !passwordsMatch}
                            className={cn(
                                "w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-medium",
                                isLoading && "opacity-80"
                            )}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                    Creando cuenta...
                                </span>
                            ) : (
                                "Crear cuenta"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        {"¿Ya tienes una cuenta? "}
                        <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
