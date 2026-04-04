"use node"

import { renderChangelogContent } from "../lib/changelog-presenter"
import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"

export const deliverPublishedWebhook = internalAction({
  args: {
    changelogId: v.id("changelog"),
  },
  handler: async (ctx, args) => {
    const { createHmac } = await import("node:crypto")

    const payload = await ctx.runQuery(
      internal.changelog.getPublishedWebhookPayload,
      {
        changelogId: args.changelogId,
      }
    )

    if (!payload) {
      return
    }

    for (const webhook of payload.webhooks) {
      const body = JSON.stringify({
        event: "changelog.published",
        createdAt: new Date().toISOString(),
        project: payload.project,
        changelog: {
          ...payload.changelog,
          contentHtml: renderChangelogContent(payload.changelog.content),
        },
      })

      const signature = createHmac("sha256", webhook.signingSecret)
        .update(body)
        .digest("hex")

      let status: "success" | "failed" = "failed"
      let responseStatus: number | undefined
      let responseBody: string | undefined
      let errorMessage: string | undefined

      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "user-agent": "Projectify-Webhook",
            "x-projectify-event": "changelog.published",
            "x-projectify-signature": `sha256=${signature}`,
          },
          body,
        })

        responseStatus = response.status
        responseBody = (await response.text()).slice(0, 1000)
        status = response.ok ? "success" : "failed"
      } catch (error) {
        errorMessage =
          error instanceof Error ? error.message : "Webhook request failed"
      }

      await ctx.runMutation(internal.changelog.recordWebhookDelivery, {
        webhookId: webhook._id,
        projectId: webhook.projectId,
        changelogId: payload.changelog._id,
        requestUrl: webhook.url,
        requestBody: body,
        responseStatus,
        responseBody,
        status,
        errorMessage,
      })
    }
  },
})
