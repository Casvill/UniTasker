"use client"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { logout } from "@/lib/api"

export default function LogoutPage() {
  const router = useRouter()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <div className="flex items-center justify-center min-h-[calc(100vh-100px)]">
          <Card className="p-8 max-w-md w-full text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <LogOut className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Cerrar Sesión</h1>
              <p className="text-muted-foreground">¿Estás seguro de que deseas cerrar tu sesión?</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleLogout}>
                Cerrar Sesión
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  )
}
