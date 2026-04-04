import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    name: "Projectify Feedback Integration",
    endpoints: [
      {
        method: "POST",
        path: "/api/feedback/{projectId}",
        description: "Submit public feedback into a project board.",
        body: {
          title: "string",
          description: "string",
          category: "bug | feature | improvement",
          submitterName: "string (optional)",
          submitterEmail: "string (optional)",
          anonymousId: "string (optional)",
        },
      },
    ],
  })
}
