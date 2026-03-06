"use client"

import { Info } from "lucide-react"

export function TodayRuleInfo() {
    return (
        <div className="rounded-xl border bg-muted/40 p-4">
            <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                    <p className="text-sm font-medium">Cómo se ordena esta vista</p>
                    <p className="text-sm text-muted-foreground">
                        Las subtareas se agrupan en <strong>Vencidas</strong>, <strong>Para hoy</strong> y{" "}
                        <strong>Próximas</strong>. Dentro de cada grupo, se ordenan por fecha priorizando la de <strong>menor esfuerzo</strong>.
                    </p>
                </div>
            </div>
        </div>
    )
}