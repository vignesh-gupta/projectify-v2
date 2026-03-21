import { Construction } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Group Messaging</h1>
        <p className="text-muted-foreground">
          Communicate with your team effortlessly using our built-in group messaging feature.
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
            This feature is currently under development. You&apos;ll be able to chat with your
            team members, share updates, and collaborate in real-time here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
