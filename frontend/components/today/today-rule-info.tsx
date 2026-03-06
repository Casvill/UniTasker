"use client"

import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function TodayRuleInfo() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Info className="h-4 w-4" />
                    ¿Cómo se ordena esto?
                </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[320px]">
                <div className="space-y-2">
                    <p className="text-sm font-medium">Regla de orden</p>
                    <p className="text-sm text-muted-foreground">
                        Se agrupa en <b>Vencidas</b>, <b>Para hoy</b> y <b>Próximas</b>.
                        <br />
                        Orden: vencidas (más antiguas primero), hoy, y próximas (fecha más cercana).
                        <br />
                        Empates: primero la de <b>menor esfuerzo</b>.
                    </p>
                </div>
            </PopoverContent>
        </Popover>
    )
}