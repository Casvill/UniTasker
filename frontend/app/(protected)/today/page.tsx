import { Header } from "@/components/dashboard/header"
import { TodayContent } from "@/components/today/today-content"
import { TodayRuleInfo } from "@/components/today/today-rule-info"

export default function TodayPage() {
    return (
        <>
            <Header
                title="Hoy"
                description="Lo urgente y lo próximo, ordenado para decidir qué hacer primero."
            />

            <div className="mt-6">
                <TodayContent />
            </div>
        </>
    )
}