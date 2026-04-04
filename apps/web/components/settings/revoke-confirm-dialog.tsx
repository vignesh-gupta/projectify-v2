"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog"

interface RevokeConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  keyName: string
  isLoading?: boolean
}

export function RevokeConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  keyName,
  isLoading,
}: RevokeConfirmDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke &quot;{keyName}&quot;? This action cannot
            be undone and any applications using this key will immediately lose
            access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Revoking..." : "Revoke Key"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
