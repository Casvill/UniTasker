
import { Header } from "@/components/dashboard/header"
import { CalendarContent } from "@/components/calendar/calendar-content"
import { Button } from "@/components/ui/button"

export default function CalendarPage() {
  return (
      <>
        <Header
          title="Calendario"
          description="Visualiza un panorama mucho mas amplío de tus actividades."
          actions={
            <Button className="w-full sm:w-auto h-9 text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
              + Add Event
            </Button>
          }
        />

        <div className="mt-6">
          <CalendarContent />
        </div>
      </>
  )
}
