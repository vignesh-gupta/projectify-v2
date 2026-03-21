import { Construction } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function WorkItemsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Work Items</h1>
        <p className="text-muted-foreground">
          Easily create and manage work items to keep track of tasks and deliverables.
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
            This feature is currently under development. You&apos;ll be able to create, assign,
            and track work items for your project here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
