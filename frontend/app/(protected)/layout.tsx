"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { getAccessToken } from "@/lib/api"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      router.push("/login")
      setIsAuthorized(false)
    } else {
      setIsAuthorized(true)
    }
  }, [router])

  // Don't render anything while we check auth
  if (isAuthorized === null || isAuthorized === false) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-background">

      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} className="fixed inset-y-0 left-0 h-screen" />

      <main className={`flex-1 transition-all duration-500 p-4 lg:p-6 ${isCollapsed ? "lg:ml-22" : "lg:ml-64"}`}>
        {children}
      </main>

      {/* <div className="flex-1">{children}</div> */}
    </div>
  )
}