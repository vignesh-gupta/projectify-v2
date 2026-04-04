"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Copy, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface KeyRevealDialogProps {
  isOpen: boolean
  onClose: () => void
  apiKey: string
  keyName: string
}

export function KeyRevealDialog({
  isOpen,
  onClose,
  apiKey,
  keyName,
}: KeyRevealDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      toast.success("API key copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Created Successfully</DialogTitle>
          <DialogDescription>
            Copy your API key now. For security reasons, you won&apos;t be able to
            see it again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-yellow-600 bg-yellow-50 p-3 dark:bg-yellow-950/20">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Important</p>
                <p>
                  Make sure to copy your API key now. You won&apos;t be able to see
                  it again!
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">API Key Name</label>
            <Input value={keyName} disabled />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your API Key</label>
            <div className="flex gap-2">
              <Input
                value={apiKey}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={onClose}>I&apos;ve saved my key</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
