import { Construction } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function FeedbacksPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Feedbacks</h1>
        <p className="text-muted-foreground">
          Gather feedback from your team or stakeholders and convert them directly into actionable
          work items.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Construction className="size-5" />
            Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This feature is currently under development. You&apos;ll be able to collect feedback,
            discuss improvements, and create work items from suggestions here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
