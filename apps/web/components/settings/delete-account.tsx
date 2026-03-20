"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
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
import { toast } from "sonner"
import { Loader2, AlertTriangle, Trash2 } from "lucide-react"

export function DeleteAccount() {
  const deleteAccount = useMutation(api.users.deleteAccount)
  const { signOut } = useAuthActions()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [confirmation, setConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (confirmation !== "DELETE") {
      toast.error("Please type DELETE to confirm")
      return
    }

    setIsDeleting(true)

    try {
      await deleteAccount({ confirmation })
      toast.success("Account deleted successfully")
      
      // Sign out after deletion
      await signOut()
      
      // Redirect to home page
      window.location.href = "/"
    } catch (error) {
      console.error("Failed to delete account:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again."
      )
      setIsDeleting(false)
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!isDeleting) {
      setDeleteDialogOpen(open)
      setConfirmation("")
    }
  }

  return (
    <>
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Irreversible and destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <h3 className="font-semibold text-foreground">Delete Account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                All your personal data will be permanently deleted
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                You will be removed from all projects
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                Projects where you are the sole owner cannot be deleted if they have other members
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground" />
                All tasks you created will be deleted
              </li>
            </ul>
            <Button
              variant="destructive"
              className="mt-4"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-6 text-destructive" />
              <AlertDialogTitle>Delete Account?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4">
              <p>
                This action <strong>cannot be undone</strong>. This will permanently delete
                your account and remove all associated data.
              </p>
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm font-medium text-destructive">
                  Warning: Make sure you:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-destructive">
                  <li>• Have transferred ownership of any projects you own</li>
                  <li>• Have left all projects or assigned new owners</li>
                  <li>• Have backed up any important data</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation" className="text-foreground">
                  Type <strong>DELETE</strong> to confirm
                </Label>
                <Input
                  id="delete-confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DELETE"
                  disabled={isDeleting}
                  autoComplete="off"
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || confirmation !== "DELETE"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete My Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
