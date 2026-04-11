import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"

export default function McpDocsLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-6 py-12">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-96" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    </main>
  )
}

