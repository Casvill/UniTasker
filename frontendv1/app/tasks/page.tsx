"use client"

import { useState } from "react"
import { Header } from "@/components/dashboard/header"
import { TasksContent } from "@/components/tasks/tasks-content"
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog"

export default function TasksPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header
          title="Tareas"
          description="Maneja y prioriza tus tareas eficientemente."
          actions={
            <CreateTaskDialog
              onCreated={() => setRefreshKey((k) => k + 1)}
            />
          }
        />

        <div className="mt-6">
          <TasksContent refreshKey={refreshKey} />
        </div>
      </main>
    </div>
  )
}