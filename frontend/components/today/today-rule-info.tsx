"use client"

import { CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export function TodayRuleInfo() {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-transparent">
                        <CircleHelp className="h-4 w-4" />
                        Info
                    </Button>
                </TooltipTrigger>

                <TooltipContent side="bottom" align="center" className="max-w-xs">
                    <p className="text-sm">
                        Las subtareas se agrupan en <strong>Vencidas</strong>,{" "}
                        <strong>Para hoy</strong> y <strong>Próximas</strong>. Dentro de cada
                        grupo se ordenan por fecha priorizando la de{" "}
                        <strong>menor esfuerzo</strong>.
                    </p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}