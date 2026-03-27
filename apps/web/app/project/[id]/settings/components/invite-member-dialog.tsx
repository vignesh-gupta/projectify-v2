"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { toast } from "sonner"
import { Loader2, UserPlus } from "lucide-react"

interface InviteMemberDialogProps {
  projectId: Id<"projects">
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  email: string
  role: "owner" | "admin" | "member"
}

export function InviteMemberDialog({
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: "",
      role: "member",
    },
  })

  const role = watch("role")

  const onSubmit = async () => {
    setIsSubmitting(true)

    try {
      // Note: In a real implementation, you would need to:
      // 1. Search for user by email
      // 2. If user doesn't exist, send invitation email
      // 3. If user exists, add them to project

      // For now, we'll show a toast indicating this needs backend implementation
      toast.info("User invitation system coming soon!")
      
      // This is a placeholder - you'll need to implement user search
      // const user = await searchUserByEmail(data.email)
      // if (!user) {
      //   toast.error("User not found. Consider sending an invitation email.")
      //   return
      // }

      // await addMember({
      //   projectId,
      //   userId: user._id,
      //   role: data.role,
      // })

      // toast.success(`Member invited successfully with ${data.role} role`)
      reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to invite member:", error)
      const message = error instanceof Error ? error.message : "Failed to invite member"
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new member to this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              placeholder="colleague@example.com"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={role}
              onValueChange={(value) =>
                setValue("role", value as "owner" | "admin" | "member", { shouldDirty: true })
              }
            >
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {role === "owner" &&
                "Full control over project including deletion"}
              {role === "admin" &&
                "Can manage members and all project resources"}
              {role === "member" &&
                "Can view and contribute to project tasks"}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                reset()
                onOpenChange(false)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
