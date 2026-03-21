import { Construction } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

export default function ResourcesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Resource Management</h1>
        <p className="text-muted-foreground">
          Organize and manage your project resources, including links and files, all in one place.
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
            This feature is currently under development. You&apos;ll be able to upload files,
            save links, and organize all your project resources here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
