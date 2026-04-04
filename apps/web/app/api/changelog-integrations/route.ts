import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    name: "Projectify Changelog Integration",
    authentication: "Bearer <api_key> or x-api-key header",
    endpoints: [
      {
        method: "GET",
        path: "/api/changelog/{projectId}",
        description: "List published changelog entries for a project.",
      },
      {
        method: "GET",
        path: "/api/changelog/{projectId}/{changelogId}",
        description: "Fetch a single published changelog entry.",
      },
      {
        method: "GET",
        path: "/embed/changelog/{projectId}",
        description: "Render a compact embeddable changelog widget.",
      },
    ],
    webhooks: {
      event: "changelog.published",
      signatureHeader: "x-projectify-signature",
      algorithm: "sha256",
    },
  })
}
