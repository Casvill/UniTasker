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
    <div className="min-h-screen lg:flex">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1">{children}</div>
    </div>
  )
}