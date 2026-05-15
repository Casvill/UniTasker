"use client"

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react"
import { apiFetch } from "@/lib/api"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type CalendarDaySummary = {
  day: number
  count: number
  hasConflict: boolean
}

type ConflictContextValue = {
  /** Número de días con conflicto en el mes actual */
  conflictDays: number
  /** Llama esto desde cualquier vista después de resolver un conflicto */
  refreshConflicts: () => Promise<void>
}

// ─── Contexto ─────────────────────────────────────────────────────────────────

const ConflictContext = createContext<ConflictContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ConflictProvider({ children }: { children: React.ReactNode }) {
  const [conflictDays, setConflictDays] = useState(0)
  const activeRef = useRef(true)

  const refreshConflicts = useCallback(async () => {
    try {
      const today = new Date()
      const month = today.getMonth() + 1
      const year = today.getFullYear()

      const data = await apiFetch<CalendarDaySummary[]>(
        `/tareas/calendario-mensual/?month=${month}&year=${year}`
      )

      if (activeRef.current) {
        setConflictDays(data.filter((day) => day.hasConflict).length)
      }
    } catch (error) {
      console.error("No se pudo cargar el resumen de conflictos", error)
      if (activeRef.current) setConflictDays(0)
    }
  }, [])

  useEffect(() => {
    activeRef.current = true
    refreshConflicts()

    return () => {
      activeRef.current = false
    }
  }, [refreshConflicts])

  return (
    <ConflictContext.Provider value={{ conflictDays, refreshConflicts }}>
      {children}
    </ConflictContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConflicts() {
  const ctx = useContext(ConflictContext)
  if (!ctx) {
    throw new Error("useConflicts debe usarse dentro de <ConflictProvider>")
  }
  return ctx
}