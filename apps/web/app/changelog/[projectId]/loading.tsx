import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

export default function PublicChangelogLoading() {
  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <div className="space-y-3">
          <div className="h-6 w-32 rounded bg-muted" />
          <div className="h-10 w-80 rounded bg-muted" />
          <div className="h-4 w-96 rounded bg-muted" />
        </div>

        <div className="space-y-5">
          {Array.from({ length: 2 }).map((_, index) => (
            <Card key={index}>
              <CardHeader className="space-y-3">
                <div className="h-5 w-48 rounded bg-muted" />
                <div className="h-7 w-72 rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="h-4 w-full rounded bg-muted" />
                <div className="h-4 w-11/12 rounded bg-muted" />
                <div className="h-4 w-10/12 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
