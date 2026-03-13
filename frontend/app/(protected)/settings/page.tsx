import { Header } from "@/components/dashboard/header"
import { SettingsContent } from "@/components/settings/settings-content"

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen bg-background">

      <main className="flex-1 p-4 lg:p-6 lg:ml-64">
        <Header title="Configuración de la cuenta" description="Administra tu perfil y ajusta cómo funciona tu planificación de estudio." />

        <div className="mt-6">
          <SettingsContent />
        </div>
      </main>
    </div>
  )
}
