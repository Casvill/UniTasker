import { Header } from "@/components/dashboard/header"
import { HelpContent } from "@/components/help/help-content"

export default function HelpPage() {
  return (
      <>
        <Header title="Help & Support" description="Get help with using Tasko and find answers to common questions." />

        <div className="mt-6">
          <HelpContent />
        </div>
      </>

  )
}
