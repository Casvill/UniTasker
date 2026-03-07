"use client"

import { Search, Filter, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TodayRuleInfo } from "@/components/today/today-rule-info"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type TodayFiltersProps = {
    query: string
    courseFilter: string
    statusFilter: string
    availableCourses: string[]
    onQueryChange: (value: string) => void
    onCourseChange: (value: string) => void
    onStatusChange: (value: string) => void
}

export function TodayFilters({
    query,
    courseFilter,
    statusFilter,
    availableCourses,
    onQueryChange,
    onCourseChange,
    onStatusChange,
}: TodayFiltersProps) {
    const selectedCourseLabel =
        courseFilter === "all" ? "Curso" : courseFilter

    const selectedStatusLabel =
        statusFilter === "all"
            ? "Estado"
            : statusFilter === "pendiente"
                ? "Pendiente"
                : statusFilter === "hecha" || statusFilter === "finalizado"
                    ? "Finalizado"
                    : statusFilter

    return (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar subtareas..."
                    className="pl-10"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <TodayRuleInfo />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-transparent max-w-[140px] sm:max-w-none">
                            <Filter className="h-4 w-4 shrink-0" />
                            <span className="truncate">{selectedCourseLabel}</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => onCourseChange("all")}>
                            Todos los cursos
                        </DropdownMenuItem>

                        {availableCourses.map((course) => (
                            <DropdownMenuItem
                                key={course}
                                onClick={() => onCourseChange(course)}
                            >
                                {course}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2 bg-transparent max-w-[140px] sm:max-w-none">
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                            <span className="truncate">{selectedStatusLabel}</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onStatusChange("all")}>
                            Todos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange("pendiente")}>
                            Pendiente
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusChange("hecha")}>
                            Finalizado
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}