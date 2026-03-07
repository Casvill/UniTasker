import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const _geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})
const _geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Unitasker",
  description: "Planifique, priorice y realice sus tareas con facilidad",
  generator: "v0.app",
  icons: {
    icon: "/unitaskerfavi.svg",
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Permitir zoom pero empezar en 1
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning className="overflow-x-hidden">
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased overflow-x-hidden w-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="unitasker-theme"
        >
          {children}
          <ThemeToggle />

          <Toaster
            position="top-center"
            expand
            richColors
            closeButton
            duration={5000}
            toastOptions={{
              className: "text-sm md:text-lg px-4 md:px-8 py-3 md:py-5 rounded-xl md:rounded-2xl shadow-2xl border bg-card w-[calc(100vw-2rem)] md:w-auto",
            }}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}