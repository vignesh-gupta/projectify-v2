import type { Id } from "@/convex/_generated/dataModel"
import { getPublishedChangelog } from "@/lib/changelog-api"
import { escapeXml, stripHtml } from "@/lib/changelog-presenter"

interface RssRouteProps {
  params: Promise<{ projectId: string }>
}

export async function GET(_request: Request, { params }: RssRouteProps) {
  const { projectId } = await params
  const data = await getPublishedChangelog(projectId as Id<"projects">)
  type PublishedEntry = (typeof data.entries)[number]

  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_CONVEX_SITE_URL ??
    "http://localhost:3000"

  const channelUrl = `${siteUrl}/changelog/${projectId}`

  const items = data.entries
    .map((entry: PublishedEntry) => {
      const description = escapeXml(stripHtml(entry.content))
      const title = escapeXml(`v${entry.version} - ${entry.title}`)
      const pubDate = new Date(entry.publishedAt ?? entry.createdAt).toUTCString()

      return `
        <item>
          <title>${title}</title>
          <description>${description}</description>
          <guid>${entry._id}</guid>
          <pubDate>${pubDate}</pubDate>
          <link>${channelUrl}</link>
        </item>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(`${data.project.title} changelog`)}</title>
    <description>${escapeXml(
      data.project.description || `Published updates for ${data.project.title}`
    )}</description>
    <link>${channelUrl}</link>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
    },
  })
}
