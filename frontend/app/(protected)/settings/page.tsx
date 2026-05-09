import { Header } from "@/components/dashboard/header"
import { SettingsContent } from "@/components/settings/settings-content"

export default function SettingsPage() {
  return (
      <>
        <Header title="Configuración de la cuenta" description="Administra tu perfil y ajusta cómo funciona tu planificación de estudio." />

        <div className="mt-6">
          <SettingsContent />
        </div>
      </>
  )
}
