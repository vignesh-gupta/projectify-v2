"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Plus } from "lucide-react"

const AVAILABLE_SCOPES = [
  { value: "projects:read", label: "Projects: Read", description: "View projects" },
  { value: "projects:write", label: "Projects: Write", description: "Create and modify projects" },
  { value: "tasks:read", label: "Tasks: Read", description: "View tasks" },
  { value: "tasks:write", label: "Tasks: Write", description: "Create and modify tasks" },
  { value: "feedback:read", label: "Feedback: Read", description: "View feedback" },
  { value: "feedback:write", label: "Feedback: Write", description: "Create and modify feedback" },
  { value: "changelog:read", label: "Changelog: Read", description: "View changelog entries" },
  { value: "changelog:write", label: "Changelog: Write", description: "Create and publish changelog" },
] as const

interface CreateApiKeyDialogProps {
  onCreateKey: (data: {
    name: string
    scopes: string[]
    expiresAt?: number
  }) => void
  isLoading?: boolean
  disabled?: boolean
}

export function CreateApiKeyDialog({
  onCreateKey,
  isLoading,
  disabled,
}: CreateApiKeyDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [expirationDays, setExpirationDays] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    if (selectedScopes.length === 0) {
      return
    }

    // Calculate expiration date if specified
    let expiresAt: number | undefined
    if (expirationDays && parseInt(expirationDays) > 0) {
      const days = parseInt(expirationDays)
      expiresAt = Date.now() + days * 24 * 60 * 60 * 1000
    }

    onCreateKey({
      name: name.trim(),
      scopes: selectedScopes,
      expiresAt,
    })

    // Reset form
    setName("")
    setSelectedScopes([])
    setExpirationDays("")
    setIsOpen(false)
  }

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.filter((s) => s !== scope)
        : [...prev, scope]
    )
  }

  const selectAllScopes = () => {
    setSelectedScopes(AVAILABLE_SCOPES.map((s) => s.value))
  }

  const clearAllScopes = () => {
    setSelectedScopes([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key to authenticate with the Projectify API, CLI,
            or MCP servers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., Production CLI Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              A descriptive name to help you identify this key
            </p>
          </div>

          {/* Scopes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>
                Permissions <span className="text-destructive">*</span>
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllScopes}
                  disabled={isLoading}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllScopes}
                  disabled={isLoading}
                >
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border p-4">
              {AVAILABLE_SCOPES.map((scope) => (
                <div key={scope.value} className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id={scope.value}
                    checked={selectedScopes.includes(scope.value)}
                    onChange={() => toggleScope(scope.value)}
                    disabled={isLoading}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div className="grid gap-1">
                    <label
                      htmlFor={scope.value}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {scope.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {scope.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedScopes.length === 0 && (
              <p className="text-xs text-destructive">
                Please select at least one permission
              </p>
            )}
          </div>

          {/* Expiration Days */}
          <div className="space-y-2">
            <Label htmlFor="expiration">Expiration (Optional)</Label>
            <Input
              id="expiration"
              type="number"
              placeholder="Days until expiration (leave empty for no expiration)"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              disabled={isLoading}
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              Number of days until this key expires (leave empty for no expiration)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name.trim() || selectedScopes.length === 0}
            >
              {isLoading ? "Creating..." : "Create Key"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
