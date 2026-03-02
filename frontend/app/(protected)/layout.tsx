import type React from "react"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen lg:flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1">{children}</div>
    </div>
  )
}