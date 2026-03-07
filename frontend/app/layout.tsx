import type React from "react"
import type { Metadata } from "next"
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${_geist.variable} ${_geistMono.variable} font-sans antialiased`}>
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
              className: "text-lg px-8 py-5 rounded-2xl shadow-2xl border bg-card",
            }}
          />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}