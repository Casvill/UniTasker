"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, CheckCircle2, ShieldCheck, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import Image from "next/image"

type Step = "email" | "code" | "password" | "success"

const STEP_CONFIG: Record<Exclude<Step, "success">, { title: string; description: string }> = {
    email: {
        title: "Recuperar contrasena",
        description: "Ingresa tu correo electronico y te enviaremos un codigo de verificacion.",
    },
    code: {
        title: "Verificar codigo",
        description: "Ingresa el codigo de 6 digitos que enviamos a tu correo.",
    },
    password: {
        title: "Nueva contrasena",
        description: "Crea una nueva contrasena segura para tu cuenta.",
    },
}

const BRANDING_CONFIG: Record<Exclude<Step, "success">, { heading: string; body: string; cardTitle: string; cardBody: string }> = {
    email: {
        heading: "No te preocupes, suele pasar.",
        body: "Te ayudaremos a recuperar el acceso a tu cuenta en pocos pasos.",
        cardTitle: "Recuperacion rapida",
        cardBody: "Revisa tu bandeja de entrada para encontrar el codigo de verificacion.",
    },
    code: {
        heading: "Revisa tu bandeja de entrada",
        body: "Hemos enviado un codigo de 6 digitos a tu correo. Ingresalo para continuar.",
        cardTitle: "Codigo seguro",
        cardBody: "El codigo expira en 10 minutos. No lo compartas con nadie.",
    },
    password: {
        heading: "Casi terminamos",
        body: "Elige una contrasena segura que no hayas usado antes.",
        cardTitle: "Contrasena segura",
        cardBody: "Usa al menos 8 caracteres, una mayuscula, un numero y un simbolo.",
    },
}

const BRANDING_ICONS: Record<Exclude<Step, "success">, React.ReactNode> = {
    email: <Mail className="w-4 h-4 text-primary-foreground" />,
    code: <ShieldCheck className="w-4 h-4 text-primary-foreground" />,
    password: <Lock className="w-4 h-4 text-primary-foreground" />,
}

export function ForgotPasswordForm() {
    const [step, setStep] = useState<Step>("email")
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [code, setCode] = useState<string[]>(Array(6).fill(""))
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [error, setError] = useState("")
    const [codeAttempts, setCodeAttempts] = useState(0)
    const [shakeCode, setShakeCode] = useState(false)
    const MAX_CODE_ATTEMPTS = 5
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        if (resendCooldown <= 0) return
        const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [resendCooldown])

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        // TODO: Replace with real API call
        // Simulate: if email is not registered, show error
        // For demo purposes, "error@test.com" triggers the error
        if (email === "error@test.com") {
            setIsLoading(false)
            setError("No encontramos una cuenta con ese correo electronico.")
            return
        }
        setIsLoading(false)
        setStep("code")
        setResendCooldown(60)
        setCodeAttempts(0)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
    }

    const handleCodeChange = useCallback(
        (index: number, value: string) => {
            if (!/^\d*$/.test(value)) return
            const next = [...code]
            if (value.length > 1) {
                const digits = value.split("").slice(0, 6)
                digits.forEach((d, i) => {
                    if (index + i < 6) next[index + i] = d
                })
                setCode(next)
                const focusIdx = Math.min(index + digits.length, 5)
                inputRefs.current[focusIdx]?.focus()
            } else {
                next[index] = value
                setCode(next)
                if (value && index < 5) inputRefs.current[index + 1]?.focus()
            }
        },
        [code]
    )

    const handleCodeKeyDown = useCallback(
        (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Backspace" && !code[index] && index > 0) {
                inputRefs.current[index - 1]?.focus()
            }
        },
        [code]
    )

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (codeAttempts >= MAX_CODE_ATTEMPTS) {
            setError("Demasiados intentos fallidos. Solicita un nuevo codigo.")
            return
        }

        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        // TODO: Replace with real API call
        // Simulate: code "000000" triggers an invalid code error for demo
        const enteredCode = code.join("")
        if (enteredCode === "000000") {
            setIsLoading(false)
            const newAttempts = codeAttempts + 1
            setCodeAttempts(newAttempts)
            setShakeCode(true)
            setTimeout(() => setShakeCode(false), 600)

            if (newAttempts >= MAX_CODE_ATTEMPTS) {
                setError("Demasiados intentos fallidos. Solicita un nuevo codigo.")
            } else {
                setError(`Codigo invalido. ${MAX_CODE_ATTEMPTS - newAttempts} intento${MAX_CODE_ATTEMPTS - newAttempts === 1 ? "" : "s"} restante${MAX_CODE_ATTEMPTS - newAttempts === 1 ? "" : "s"}.`)
            }
            setCode(Array(6).fill(""))
            setTimeout(() => inputRefs.current[0]?.focus(), 100)
            return
        }

        setIsLoading(false)
        setStep("password")
        setError("")
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (password !== confirmPassword) return
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1200))
        // TODO: Replace with real API call
        // Simulate: an API error could happen here
        setIsLoading(false)
        setStep("success")
    }

    const handleResendCode = async () => {
        if (resendCooldown > 0) return
        setError("")
        setIsLoading(true)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setIsLoading(false)
        setResendCooldown(60)
        setCode(Array(6).fill(""))
        setCodeAttempts(0)
        inputRefs.current[0]?.focus()
    }

    const isCodeComplete = code.every((d) => d !== "")
    const passwordsMatch = password.length > 0 && password === confirmPassword
    const hasMinLength = password.length >= 8
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial

    const currentBranding = step !== "success" ? BRANDING_CONFIG[step] : null
    const currentStepConfig = step !== "success" ? STEP_CONFIG[step] : null

    return (
        <div className="flex min-h-screen">
            {/* Left panel - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col items-center justify-center p-12">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-72 h-72 rounded-full border-2 border-primary-foreground" />
                    <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full border-2 border-primary-foreground" />
                    <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full border-2 border-primary-foreground" />
                </div>

                <div className="relative z-10 max-w-md text-center">

                    {currentBranding && (
                        <>
                            <h1 className="text-4xl font-bold text-primary-foreground mb-4 text-balance">
                                {currentBranding.heading}
                            </h1>
                            <p className="text-primary-foreground/70 text-lg leading-relaxed">
                                {currentBranding.body}
                            </p>

                            {/* Progress indicator */}
                            <div className="mt-8 flex items-center justify-center gap-2">
                                {(["email", "code", "password"] as const).map((s, i) => (
                                    <div key={s} className="flex items-center gap-2">
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                                                step === s
                                                    ? "bg-primary-foreground text-primary"
                                                    : (["email", "code", "password"] as const).indexOf(step as "email" | "code" | "password") > i
                                                        ? "bg-primary-foreground/40 text-primary-foreground"
                                                        : "bg-primary-foreground/10 text-primary-foreground/40"
                                            )}
                                        >
                                            {(["email", "code", "password"] as const).indexOf(step as "email" | "code" | "password") > i ? (
                                                <CheckCircle2 className="w-4 h-4" />
                                            ) : (
                                                i + 1
                                            )}
                                        </div>
                                        {i < 2 && (
                                            <div
                                                className={cn(
                                                    "w-8 h-0.5 rounded-full transition-all duration-300",
                                                    (["email", "code", "password"] as const).indexOf(step as "email" | "code" | "password") > i
                                                        ? "bg-primary-foreground/40"
                                                        : "bg-primary-foreground/10"
                                                )}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex flex-col items-center gap-4">
                                <div className="w-full max-w-xs rounded-xl bg-primary-foreground/10 p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                            {BRANDING_ICONS[step as Exclude<Step, "success">]}
                                        </div>
                                        <p className="text-sm font-medium text-primary-foreground">{currentBranding.cardTitle}</p>
                                    </div>
                                    <p className="text-sm text-primary-foreground/60 leading-relaxed">
                                        {currentBranding.cardBody}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="flex items-center justify-center mb-10">
                        <Image
                            src="/unitasker.svg"
                            alt="Logo UniTasker"
                            width={300}
                            height={300}
                            priority
                            className="w-24 md:w-32 lg:w-48 h-auto drop-shadow-xl"
                        />
                    </div>

                    {/* Mobile progress indicator */}
                    {step !== "success" && (
                        <div className="lg:hidden flex items-center justify-center gap-2">
                            {(["email", "code", "password"] as const).map((s, i) => (
                                <div key={s} className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300",
                                            step === s
                                                ? "bg-primary text-primary-foreground"
                                                : (["email", "code", "password"] as const).indexOf(step as "email" | "code" | "password") > i
                                                    ? "bg-primary/30 text-primary"
                                                    : "bg-muted text-muted-foreground"
                                        )}
                                    >
                                        {(["email", "code", "password"] as const).indexOf(step as "email" | "code" | "password") > i ? (
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                        ) : (
                                            i + 1
                                        )}
                                    </div>
                                    {i < 2 && (
                                        <div
                                            className={cn(
                                                "w-6 h-0.5 rounded-full transition-all duration-300",
                                                (["email", "code", "password"] as const).indexOf(step as "email" | "code" | "password") > i
                                                    ? "bg-primary/30"
                                                    : "bg-muted"
                                            )}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 1: Email */}
                    {step === "email" && (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold text-foreground">{currentStepConfig?.title}</h2>
                                <p className="text-muted-foreground mt-1">{currentStepConfig?.description}</p>
                            </div>

                            <form onSubmit={handleSendCode} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Correo electronico</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="tu@correo.com"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setError("") }}
                                            className={cn("pl-10", error && "border-destructive focus-visible:ring-destructive")}
                                            required
                                        />
                                    </div>
                                    {error && step === "email" && (
                                        <p className="text-xs text-destructive flex items-center gap-1.5">
                                            <span className="w-3.5 h-3.5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                                <span className="text-destructive text-[10px] font-bold">!</span>
                                            </span>
                                            {error}
                                        </p>
                                    )}
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
                                            Enviando codigo...
                                        </span>
                                    ) : (
                                        "Enviar codigo de verificacion"
                                    )}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* Step 2: Code verification */}
                    {step === "code" && (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold text-foreground">{currentStepConfig?.title}</h2>
                                <p className="text-muted-foreground mt-1">
                                    {"Enviamos un codigo a "}
                                    <span className="font-medium text-foreground">{email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyCode} className="space-y-6">
                                <div className="space-y-3">
                                    <Label>Codigo de verificacion</Label>
                                    <div
                                        className={cn(
                                            "flex items-center justify-center gap-2 sm:gap-3",
                                            shakeCode && "animate-[shake_0.5s_ease-in-out]"
                                        )}
                                    >
                                        {code.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => { inputRefs.current[index] = el }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={6}
                                                value={digit}
                                                onChange={(e) => { handleCodeChange(index, e.target.value); setError("") }}
                                                onKeyDown={(e) => handleCodeKeyDown(index, e)}
                                                onFocus={(e) => e.target.select()}
                                                className={cn(
                                                    "w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border-2 bg-background text-foreground outline-none transition-all duration-200",
                                                    error && step === "code"
                                                        ? "border-destructive ring-1 ring-destructive/20"
                                                        : digit
                                                            ? "border-primary ring-1 ring-primary/20"
                                                            : "border-border focus:border-primary focus:ring-1 focus:ring-primary/20"
                                                )}
                                                disabled={codeAttempts >= MAX_CODE_ATTEMPTS}
                                                aria-label={`Digito ${index + 1} del codigo`}
                                            />
                                        ))}
                                    </div>
                                    {error && step === "code" && (
                                        <p className="text-xs text-destructive text-center flex items-center justify-center gap-1.5">
                                            <span className="w-3.5 h-3.5 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                                <span className="text-destructive text-[10px] font-bold">!</span>
                                            </span>
                                            {error}
                                        </p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !isCodeComplete}
                                    className={cn(
                                        "w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-medium",
                                        isLoading && "opacity-80"
                                    )}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Verificando...
                                        </span>
                                    ) : (
                                        "Verificar codigo"
                                    )}
                                </Button>

                                <div className="text-center space-y-2">
                                    <p className="text-sm text-muted-foreground">
                                        {"No recibiste el codigo? "}
                                        {resendCooldown > 0 ? (
                                            <span className="text-muted-foreground/60">
                                                Reenviar en {resendCooldown}s
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendCode}
                                                disabled={isLoading}
                                                className="text-primary hover:text-primary/80 font-medium transition-colors"
                                            >
                                                Reenviar codigo
                                            </button>
                                        )}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep("email")
                                            setCode(Array(6).fill(""))
                                        }}
                                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Cambiar correo electronico
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    {/* Step 3: New password */}
                    {step === "password" && (
                        <>
                            <div className="text-center lg:text-left">
                                <h2 className="text-2xl font-bold text-foreground">{currentStepConfig?.title}</h2>
                                <p className="text-muted-foreground mt-1">{currentStepConfig?.description}</p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">Nueva contrasena</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Minimo 8 caracteres"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 pr-10"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {password.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            {[
                                                { check: hasMinLength, label: "8+ caracteres" },
                                                { check: hasUppercase, label: "Una mayuscula" },
                                                { check: hasNumber, label: "Un numero" },
                                                { check: hasSpecial, label: "Un simbolo" },
                                            ].map((req) => (
                                                <div
                                                    key={req.label}
                                                    className={cn(
                                                        "flex items-center gap-1.5 text-xs transition-colors",
                                                        req.check ? "text-primary" : "text-muted-foreground"
                                                    )}
                                                >
                                                    <div
                                                        className={cn(
                                                            "w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors",
                                                            req.check ? "bg-primary" : "bg-muted"
                                                        )}
                                                    >
                                                        {req.check && <CheckCircle2 className="w-2.5 h-2.5 text-primary-foreground" />}
                                                    </div>
                                                    {req.label}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirmar contrasena</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="confirm-password"
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Repite tu contrasena"
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
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                            aria-label={showConfirm ? "Ocultar contrasena" : "Mostrar contrasena"}
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {confirmPassword.length > 0 && !passwordsMatch && (
                                        <p className="text-xs text-destructive">Las contrasenas no coinciden</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isLoading || !isPasswordValid || !passwordsMatch}
                                    className={cn(
                                        "w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 font-medium",
                                        isLoading && "opacity-80"
                                    )}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                            Restableciendo...
                                        </span>
                                    ) : (
                                        "Restablecer contrasena"
                                    )}
                                </Button>
                            </form>
                        </>
                    )}

                    {/* Step 4: Success */}
                    {step === "success" && (
                        <div className="text-center space-y-6">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-8 h-8 text-primary" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">Contrasena restablecida</h2>
                                <p className="text-muted-foreground mt-2 leading-relaxed">
                                    Tu contrasena ha sido actualizada exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.
                                </p>
                            </div>

                            <Link href="/login">
                                <Button className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
                                    Ir a iniciar sesion
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Back to login */}
                    {step !== "success" && (
                        <div className="flex justify-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver a iniciar sesion
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
