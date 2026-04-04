"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ScopeBadge } from "./scope-badge"
import { CreateApiKeyDialog } from "./create-api-key-dialog"
import { KeyRevealDialog } from "./key-reveal-dialog"
import { RevokeConfirmDialog } from "./revoke-confirm-dialog"
import { formatDistanceToNow } from "date-fns"
import { Key, Trash2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function ApiKeysList() {
  const [revealDialogOpen, setRevealDialogOpen] = useState(false)
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<{
    id: Id<"userApiKeys">
    name: string
  } | null>(null)
  const [createdKey, setCreatedKey] = useState<{
    apiKey: string
    name: string
  } | null>(null)

  const apiKeys = useQuery(api.userApiKeys.listUserApiKeys)
  const config = useQuery(api.userApiKeys.getUserApiKeyConfig)
  const createKey = useMutation(api.userApiKeys.createUserApiKey)
  const revokeKey = useMutation(api.userApiKeys.revokeUserApiKey)

  const [isCreating, setIsCreating] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  const handleCreateKey = async (data: {
    name: string
    scopes: string[]
    expiresAt?: number
  }) => {
    try {
      setIsCreating(true)
      const result = await createKey({
        name: data.name,
        scopes: data.scopes as any,
        expiresAt: data.expiresAt,
      })

      setCreatedKey({
        apiKey: result.apiKey,
        name: data.name,
      })
      setRevealDialogOpen(true)
      toast.success("API key created successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to create API key")
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevokeKey = async () => {
    if (!selectedKey) return

    try {
      setIsRevoking(true)
      await revokeKey({ keyId: selectedKey.id })
      toast.success("API key revoked successfully")
      setRevokeDialogOpen(false)
      setSelectedKey(null)
    } catch (error: any) {
      toast.error(error.message || "Failed to revoke API key")
    } finally {
      setIsRevoking(false)
    }
  }

  const openRevokeDialog = (keyId: Id<"userApiKeys">, keyName: string) => {
    setSelectedKey({ id: keyId, name: keyName })
    setRevokeDialogOpen(true)
  }

  const isLimitReached =
    apiKeys && config && apiKeys.length >= config.maxKeys

  if (apiKeys === undefined || config === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for CLI and MCP integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage your API keys for CLI and MCP integrations
              </CardDescription>
            </div>
            <CreateApiKeyDialog
              onCreateKey={handleCreateKey}
              isLoading={isCreating}
              disabled={isLimitReached}
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Key className="h-4 w-4" />
            <span>
              {apiKeys.length} of {config.maxKeys} keys created
            </span>
          </div>
          {isLimitReached && (
            <div className="rounded-lg border border-yellow-600 bg-yellow-50 p-3 dark:bg-yellow-950/20">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium">Key limit reached</p>
                  <p>
                    You&apos;ve reached the maximum of {config.maxKeys} API keys.
                    Please revoke an existing key to create a new one.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <Key className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No API keys yet</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first API key to start using the Projectify API, CLI,
                or MCP servers.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key._id}
                  className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{key.name}</h4>
                        <Badge
                          variant={
                            key.status === "active" ? "default" : "secondary"
                          }
                        >
                          {key.status}
                        </Badge>
                        {key.expiresAt && key.expiresAt > Date.now() && (
                          <Badge variant="outline">
                            Expires{" "}
                            {formatDistanceToNow(new Date(key.expiresAt), {
                              addSuffix: true,
                            })}
                          </Badge>
                        )}
                        {key.expiresAt && key.expiresAt <= Date.now() && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>

                      <div>
                        <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                          {key.keyPreview}
                        </code>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {key.scopes.map((scope) => (
                          <ScopeBadge key={scope} scope={scope} />
                        ))}
                      </div>

                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>
                          Created{" "}
                          {formatDistanceToNow(new Date(key.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {key.lastUsedAt && (
                          <span>
                            Last used{" "}
                            {formatDistanceToNow(new Date(key.lastUsedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                        {!key.lastUsedAt && <span>Never used</span>}
                      </div>
                    </div>

                    {key.status === "active" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openRevokeDialog(key._id, key.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {createdKey && (
        <KeyRevealDialog
          isOpen={revealDialogOpen}
          onClose={() => {
            setRevealDialogOpen(false)
            setCreatedKey(null)
          }}
          apiKey={createdKey.apiKey}
          keyName={createdKey.name}
        />
      )}

      {selectedKey && (
        <RevokeConfirmDialog
          isOpen={revokeDialogOpen}
          onClose={() => {
            setRevokeDialogOpen(false)
            setSelectedKey(null)
          }}
          onConfirm={handleRevokeKey}
          keyName={selectedKey.name}
          isLoading={isRevoking}
        />
      )}
    </>
  )
}
