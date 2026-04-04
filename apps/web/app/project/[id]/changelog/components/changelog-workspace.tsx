"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import {
  formatChangelogDate,
} from "@/lib/changelog-presenter"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Alert, AlertDescription, AlertTitle } from "@workspace/ui/components/alert"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useParams } from "next/navigation"
import Link from "next/link"
import { BookOpen, Copy, Globe2, KeyRound, Plus, Rss, Webhook } from "lucide-react"

type ChangelogEntry = Doc<"changelog"> & {
  author: {
    _id: Id<"users">
    name: string | null
    email: string
    image?: string | null
  } | null
}

type ApiKeyRecord = Doc<"apiKeys">
type WebhookRecord = Doc<"webhooks">
type WebhookDeliveryRecord = Doc<"webhookDeliveries">

type SecretState =
  | { type: "apiKey"; value: string }
  | { type: "webhook"; value: string }
  | null

export function ChangelogWorkspace() {
  const params = useParams()
  const projectId = params.id as Id<"projects">

  const changelogData = useQuery(api.changelog.listByProject, { projectId })
  const apiKeys = useQuery(api.changelog.listApiKeys, { projectId })
  const webhooks = useQuery(api.changelog.listWebhooks, { projectId })
  const webhookDeliveries = useQuery(api.changelog.listWebhookDeliveries, {
    projectId,
  })

  const createDraft = useMutation(api.changelog.createDraft)
  const updateDraft = useMutation(api.changelog.updateDraft)
  const publishEntry = useMutation(api.changelog.publish)
  const createApiKey = useMutation(api.changelog.createApiKey)
  const revokeApiKey = useMutation(api.changelog.revokeApiKey)
  const createWebhook = useMutation(api.changelog.createWebhook)
  const disableWebhook = useMutation(api.changelog.disableWebhook)

  const [docsOpen, setDocsOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingEntry, setEditingEntry] = useState<ChangelogEntry | null>(null)
  const [secretState, setSecretState] = useState<SecretState>(null)
  const [title, setTitle] = useState("")
  const [version, setVersion] = useState("")
  const [content, setContent] = useState("")
  const [apiKeyName, setApiKeyName] = useState("")
  const [webhookName, setWebhookName] = useState("")
  const [webhookUrl, setWebhookUrl] = useState("")

  const project = changelogData?.project
  const entries: ChangelogEntry[] = (changelogData?.entries ?? []) as ChangelogEntry[]
  const role = changelogData?.role
  const isPrivileged = role === "owner" || role === "admin"
  const apiKeyItems: ApiKeyRecord[] = (apiKeys ?? []) as ApiKeyRecord[]
  const webhookItems: WebhookRecord[] = (webhooks ?? []) as WebhookRecord[]
  const deliveryItems: WebhookDeliveryRecord[] = (
    webhookDeliveries ?? []
  ) as WebhookDeliveryRecord[]

  const resetEditor = () => {
    setEditingEntry(null)
    setTitle("")
    setVersion("")
    setContent("")
  }

  const openCreateDialog = () => {
    resetEditor()
    setEditorOpen(true)
  }

  const openEditDialog = (entry: ChangelogEntry) => {
    setEditingEntry(entry)
    setTitle(entry.title)
    setVersion(entry.version)
    setContent(entry.content)
    setEditorOpen(true)
  }

  const handleSaveDraft = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingEntry) {
        await updateDraft({
          changelogId: editingEntry._id,
          title,
          version,
          content,
        })
        toast.success("Draft updated")
      } else {
        await createDraft({
          projectId,
          title,
          version,
          content,
        })
        toast.success("Draft created")
      }

      setEditorOpen(false)
      resetEditor()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save draft"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublish = async (entryId: Id<"changelog">) => {
    try {
      await publishEntry({ changelogId: entryId })
      toast.success("Changelog entry published")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to publish entry"
      )
    }
  }

  const handleCreateApiKey = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const result = await createApiKey({
        projectId,
        name: apiKeyName,
      })
      setSecretState({
        type: "apiKey",
        value: result.apiKey,
      })
      setApiKeyName("")
      toast.success("API key created")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create API key"
      )
    }
  }

  const handleCreateWebhook = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const result = await createWebhook({
        projectId,
        name: webhookName,
        url: webhookUrl,
      })
      setSecretState({
        type: "webhook",
        value: result.signingSecret,
      })
      setWebhookName("")
      setWebhookUrl("")
      toast.success("Webhook created")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create webhook"
      )
    }
  }

  const copySecret = async () => {
    if (!secretState) {
      return
    }

    await navigator.clipboard.writeText(secretState.value)
    toast.success(
      `${secretState.type === "apiKey" ? "API key" : "Signing secret"} copied`
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading changelog...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Changelog</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Draft releases internally, publish updates for customers, and share
            them through the public page, RSS, and a small read-only API.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setDocsOpen(true)}>
            <BookOpen className="mr-2 size-4" />
            Docs
          </Button>
          {isPrivileged && (
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 size-4" />
              New Release
            </Button>
          )}
        </div>
      </div>

      {secretState && (
        <Alert>
          <KeyRound className="size-4" />
          <AlertTitle>
            {secretState.type === "apiKey"
              ? "Copy this API key now"
              : "Copy this webhook signing secret now"}
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              This value is only shown once. Save it somewhere secure before you
              close or refresh this page.
            </p>
            <div className="flex flex-col gap-2 rounded-md border bg-background p-3 font-mono text-xs text-foreground md:flex-row md:items-center md:justify-between">
              <span className="break-all">{secretState.value}</span>
              <Button type="button" size="sm" variant="outline" onClick={copySecret}>
                <Copy className="mr-2 size-4" />
                Copy
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe2 className="size-4" />
              Public distribution
            </CardTitle>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link href={`/changelog/${projectId}`} target="_blank">
                <Button variant="outline" size="sm">
                  <Globe2 className="mr-2 size-4" />
                  Public page
                </Button>
              </Link>
              <Link href={`/changelog/${projectId}/rss.xml`} target="_blank">
                <Button variant="outline" size="sm">
                  <Rss className="mr-2 size-4" />
                  RSS feed
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Public page:{" "}
            <Link href={`/changelog/${projectId}`} className="text-foreground underline">
              <code>/changelog/{projectId}</code>
            </Link>
          </p>
          <p>
            RSS feed:{" "}
            <Link
              href={`/changelog/${projectId}/rss.xml`}
              className="text-foreground underline"
            >
              <code>/changelog/{projectId}/rss.xml</code>
            </Link>
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="entries" className="gap-4">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="developers">Developers</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="space-y-4">
          {entries.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No changelog entries yet. Create your first release draft to get
                started.
              </CardContent>
            </Card>
          ) : (
            entries.map((entry: ChangelogEntry) => {
              return (
                <Card key={entry._id}>
                  <CardHeader className="gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-full px-2.5 py-1 font-medium"
                      >
                        <span className="text-muted-foreground">v</span>
                        <span>{entry.version}</span>
                      </Badge>
                      <Badge variant="outline">
                        {entry.status === "published" ? "Published" : "Draft"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatChangelogDate(
                          entry.status === "published"
                            ? entry.publishedAt
                            : entry.updatedAt
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{entry.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {entry.author?.name ?? entry.author?.email ?? "Unknown author"}
                        </p>
                      </div>
                      {isPrivileged && entry.status === "draft" && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(entry)}
                          >
                            Edit
                          </Button>
                          <Button size="sm" onClick={() => handlePublish(entry._id)}>
                            Publish
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <article
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: entry.content }}
                    />
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="developers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integration docs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Product docs endpoint: <code>/api/changelog-integrations</code>
              </p>
              <p>
                Authenticated list endpoint: <code>/api/changelog/{projectId}</code>
              </p>
              <p>
                Authenticated detail endpoint:{" "}
                <code>/api/changelog/{projectId}/{"{changelogId}"}</code>
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API keys</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPrivileged ? (
                  <form className="space-y-3" onSubmit={handleCreateApiKey}>
                    <div className="space-y-2">
                      <Label htmlFor="api-key-name">Name</Label>
                      <Input
                        id="api-key-name"
                        value={apiKeyName}
                        onChange={(event) => setApiKeyName(event.target.value)}
                        placeholder="Public changelog reader"
                      />
                    </div>
                    <Button type="submit">Create API key</Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only owners and admins can manage API keys.
                  </p>
                )}

                <div className="space-y-3">
                  {apiKeyItems.map((item: ApiKeyRecord) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.keyPreview}
                          </p>
                        </div>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last used: {formatChangelogDate(item.lastUsedAt)}
                      </p>
                      {isPrivileged && item.status === "active" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await revokeApiKey({ apiKeyId: item._id })
                            toast.success("API key revoked")
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Webhooks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isPrivileged ? (
                  <form className="space-y-3" onSubmit={handleCreateWebhook}>
                    <div className="space-y-2">
                      <Label htmlFor="webhook-name">Name</Label>
                      <Input
                        id="webhook-name"
                        value={webhookName}
                        onChange={(event) => setWebhookName(event.target.value)}
                        placeholder="Production deploy listener"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhook-url">URL</Label>
                      <Input
                        id="webhook-url"
                        value={webhookUrl}
                        onChange={(event) => setWebhookUrl(event.target.value)}
                        placeholder="https://example.com/webhooks/projectify"
                      />
                    </div>
                    <Button type="submit">
                      <Webhook className="mr-2 size-4" />
                      Create webhook
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Only owners and admins can manage webhooks.
                  </p>
                )}

                <div className="space-y-3">
                  {webhookItems.map((item: WebhookRecord) => (
                    <div
                      key={item._id}
                      className="flex flex-col gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.url}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {item.secretPreview}
                          </p>
                        </div>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last delivery: {formatChangelogDate(item.lastDeliveredAt)}
                      </p>
                      {isPrivileged && item.status === "active" && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await disableWebhook({ webhookId: item._id })
                            toast.success("Webhook disabled")
                          }}
                        >
                          Disable
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent webhook deliveries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliveryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No webhook deliveries yet.
                </p>
              ) : (
                deliveryItems.map((delivery: WebhookDeliveryRecord) => (
                  <div
                    key={delivery._id}
                    className="flex flex-col gap-2 rounded-md border p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{delivery.status}</Badge>
                      <span className="font-medium">{delivery.requestUrl}</span>
                    </div>
                    <p className="text-muted-foreground">
                      {formatChangelogDate(delivery.deliveredAt)}
                      {delivery.responseStatus
                        ? ` - HTTP ${delivery.responseStatus}`
                        : ""}
                    </p>
                    {delivery.errorMessage && (
                      <p className="text-destructive">{delivery.errorMessage}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) {
            resetEditor()
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px]">
          <form onSubmit={handleSaveDraft}>
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "Edit changelog draft" : "Create changelog draft"}
              </DialogTitle>
              <DialogDescription>
                Publish polished release notes for customers and keep your public
                changelog current.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="changelog-version">Version</Label>
                <div className="flex items-center overflow-hidden rounded-md border border-input bg-background">
                  <div className="flex h-9 items-center border-r bg-secondary px-3 text-sm font-medium text-secondary-foreground">
                    v
                  </div>
                  <Input
                    id="changelog-version"
                    value={version}
                    onChange={(event) => setVersion(event.target.value)}
                    placeholder="1.2.3"
                    className="border-0 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="changelog-title">Title</Label>
                <Input
                  id="changelog-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Polish the feedback board and new API docs"
                />
              </div>

              <div className="space-y-2">
                <Label>Details</Label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Summarize what changed, who benefits, and any caveats."
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditorOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingEntry ? "Save Draft" : "Create Draft"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={docsOpen} onOpenChange={setDocsOpen}>
        <SheetContent className="sm:max-w-2xl!">
          <SheetHeader>
            <SheetTitle>Changelog docs</SheetTitle>
            <SheetDescription>
              Share published release notes through the public page, RSS, API,
              and signed webhook deliveries.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 px-4 pb-6 text-sm">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Public surfaces</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {`GET /changelog/${projectId}
GET /changelog/${projectId}/rss.xml`}
                </pre>
                <p>
                  The public page and RSS feed only include entries that have
                  been published.
                </p>
                <p>
                  Each entry can describe mixed additions, fixes, and changes in
                  the body, so there is no single release category field.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Read-only API</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {`GET /api/changelog/${projectId}
Authorization: Bearer <api_key>

GET /api/changelog/${projectId}/{changelogId}
Authorization: Bearer <api_key>`}
                </pre>
                <p>
                  You can also send the key with the <code>x-api-key</code>{" "}
                  header. Only the <code>read:changelog</code> scope is supported
                  in this phase.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Webhook payload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-muted-foreground">
                <p>
                  Webhooks fire on <code>changelog.published</code> and include
                  an HMAC SHA-256 signature in the{" "}
                  <code>x-projectify-signature</code> header.
                </p>
                <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">
                  {`{
  "event": "changelog.published",
  "createdAt": "2026-04-04T12:00:00.000Z",
  "project": { "_id": "projectId", "title": "Project name" },
  "changelog": {
    "_id": "entryId",
    "version": "1.2.3",
    "title": "Release title",
    "content": "<p>HTML body</p>",
    "status": "published",
    "publishedAt": 1775300000000
  }
}`}
                </pre>
              </CardContent>
            </Card>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
