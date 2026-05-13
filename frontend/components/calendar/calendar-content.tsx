"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Video } from "lucide-react"
import { useState } from "react"

type CalendarDaySummary = {
  day: number
  count: number
  hasConflict: boolean
}

type DayTaskItem = {
  id: number
  name: string
  activityName: string
  subjectName: string
  effort: number
  hasConflict?: boolean
}

const events = [
  {
    id: 1,
    day: 3,
    title: "Team Standup",
    time: "09:00 AM",
    duration: "30 min",
    type: "meeting",
    color: "bg-blue-500",
  },
  {
    id: 2,
    day: 3,
    title: "Design Review",
    time: "11:00 AM",
    duration: "1 hour",
    type: "review",
    color: "bg-purple-500",
  },
  {
    id: 3,
    day: 12,
    title: "Client Presentation",
    time: "02:00 PM",
    duration: "2 hours",
    type: "presentation",
    color: "bg-green-600",
  },
  {
    id: 4,
    day: 17,
    title: "Code Review Session",
    time: "04:30 PM",
    duration: "45 min",
    type: "meeting",
    color: "bg-amber-500",
  },
]

const monthSummaryMock: CalendarDaySummary[] = [
  { day: 3, count: 2, hasConflict: false },
  { day: 12, count: 1, hasConflict: true },
  { day: 17, count: 1, hasConflict: false },
]

const weekDays = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate()
  const calendarDays = Array.from({ length: firstDayOfMonth + totalDaysInMonth }, (_, index) =>
    index < firstDayOfMonth ? null : index - firstDayOfMonth + 1
  )
  const today = new Date()
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const todayDate = today.getDate()
  const monthLabel = currentDate.toLocaleString("es", { month: "long", year: "numeric" })
  const effectiveSelectedDay = selectedDay ?? (isCurrentMonth ? todayDate : 1)
  const selectedDate = new Date(year, month, effectiveSelectedDay)
  const selectedDateLabel = selectedDate.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
  const monthSummary = monthSummaryMock
  const monthSummaryMap = new Map(monthSummary.map((entry) => [entry.day, entry]))
  const dayEvents = events.filter((event) => event.day === effectiveSelectedDay)

  // TODO: Enable once backend is available.
  // const monthSummary = await fetch(`/api/tareas?month=${month + 1}&year=${year}`)
  //   .then((res) => res.json() as Promise<CalendarDaySummary[]>)

  // const dayEvents = await fetch(`/api/tareas/${year}-${String(month + 1).padStart(2, "0")}-${String(
  //   effectiveSelectedDay
  // ).padStart(2, "0")}`)
  //   .then((res) => res.json() as Promise<DayTaskItem[]>)

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-semibold min-w-[120px] text-center">{monthLabel}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="grid grid-cols-7 gap-2 mb-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) =>
              day === null ? (
                <div key={`empty-${index}`} className="aspect-square" aria-hidden="true" />
              ) : (
                <button
                  key={day}
                  className={`
                    relative aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                    transition-all duration-300 hover:scale-110
                    ${
                      day === effectiveSelectedDay
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "hover:bg-secondary text-foreground"
                    }
                    ${isCurrentMonth && day < todayDate ? "opacity-40" : ""}
                  `}
                  onClick={() => setSelectedDay(day)}
                >
                  {monthSummaryMap.get(day) && (
                    <span
                      className={`
                        absolute right-2 top-2 min-w-[20px] h-[20px]
                        rounded-full text-[11px] font-semibold flex items-center justify-center
                        ${
                          monthSummaryMap.get(day)?.hasConflict
                            ? "bg-destructive text-destructive-foreground"
                            : "bg-primary text-primary-foreground"
                        }
                      `}
                      aria-label="Dia con subtareas"
                    >
                      {monthSummaryMap.get(day)?.count}
                    </span>
                  )}
                  {day}
                </button>
              )
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-1 mb-4">
            <p className="font-semibold text-lg">Eventos del dia</p>
            <p className="text-m text-muted-foreground capitalize">{selectedDateLabel}</p>
          </div>
          <div className="space-y-3">
            {dayEvents.length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin eventos para este dia.</div>
            ) : (
              dayEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-border hover:shadow-md transition-all duration-300 cursor-pointer animate-slide-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-full rounded-full ${event.color}`} />
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <p className="text-xs text-muted-foreground">{event.time}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {event.duration}
                        </Badge>
                        {event.type === "meeting" && <Video className="w-3 h-3 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
