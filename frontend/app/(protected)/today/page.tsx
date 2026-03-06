import { Header } from "@/components/dashboard/header"
import { TodayContent } from "@/components/today/today-content"
import { TodayRuleInfo } from "@/components/today/today-rule-info"

export default function TodayPage() {
    return (
        <div className="flex min-h-screen bg-background">
            <main className="flex-1 p-4 lg:ml-64 lg:p-6">
                <Header
                    title="Hoy"
                    description="Lo urgente y lo próximo, ordenado para decidir qué hacer primero."
                />

                <div className="mt-6">
                    <TodayRuleInfo />
                </div>

                <div className="mt-6">
                    <TodayContent />
                </div>
            </main>
        </div>
    )
}