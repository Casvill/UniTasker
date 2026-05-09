"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { TasksContent } from "@/components/tasks/tasks-content"
import { CreateActivityDialog } from "@/components/tasks/create-activity-dialog"

export default function TasksPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
      <>
        <Header
          title="Actividades"
          description="Crea y edita tus actividades para mantenerte al día con tus responsabilidades académicas."
          // actions={
          //   <CreateActivityDialog
          //     onCreated={() => setRefreshKey((k) => k + 1)}
          //   />
          // }
        />

        <div className="mt-6">
          <TasksContent refreshKey={refreshKey} />
        </div>
      </>
  )
}