"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
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
import { InviteMemberDialog } from "./invite-member-dialog"
import { UserPlus, Trash2, Crown, Shield, User as UserIcon, Loader2 } from "lucide-react"

interface MemberManagementProps {
  projectId: Id<"projects">
  currentUserRole: "owner" | "admin" | "member"
  isReadOnly?: boolean
}

export function MemberManagement({
  projectId,
  currentUserRole,
  isReadOnly = false,
}: MemberManagementProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Id<"memberships"> | null>(
    null
  )

  const currentUser = useQuery(api.auth.currentUser)
  const memberships = useQuery(api.memberships.listByProject, { projectId })
  const updateRole = useMutation(api.memberships.updateRole)
  const removeMember = useMutation(api.memberships.remove)

  const canManageMembers = (currentUserRole === "owner" || currentUserRole === "admin") && !isReadOnly
  const isOwner = currentUserRole === "owner" && !isReadOnly

  const handleRoleChange = async (
    membershipId: Id<"memberships">,
    newRole: "owner" | "admin" | "member"
  ) => {
    try {
      await updateRole({ membershipId, role: newRole })
      toast.success("Member role updated successfully")
    } catch (error) {
      console.error("Failed to update role:", error)
      const message = error instanceof Error ? error.message : "Failed to update member role"
      toast.error(message)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    try {
      await removeMember({ membershipId: memberToRemove })
      toast.success("Member removed successfully")
      setMemberToRemove(null)
    } catch (error) {
      console.error("Failed to remove member:", error)
      const message = error instanceof Error ? error.message : "Failed to remove member"
      toast.error(message)
    }
  }

  const getRoleBadge = (role: "owner" | "admin" | "member") => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="default" className="gap-1">
            <Crown className="size-3" />
            Owner
          </Badge>
        )
      case "admin":
        return (
          <Badge variant="secondary" className="gap-1">
            <Shield className="size-3" />
            Admin
          </Badge>
        )
      case "member":
        return (
          <Badge variant="outline" className="gap-1">
            <UserIcon className="size-3" />
            Member
          </Badge>
        )
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (!memberships) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage project members and their roles
              </CardDescription>
            </div>
            {canManageMembers && (
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="mr-2 size-4" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memberships.map((membership) => {
              const isCurrentUser = membership.userId === currentUser?._id
              const canChangeRole = isOwner && !isCurrentUser
              const canRemove = canManageMembers && !isCurrentUser
              const userName = membership.user?.name || "Unknown User"
              const userEmail = membership.user?.email || ""

              return (
                <div
                  key={membership._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                      {userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {userName}
                          {isCurrentUser && " (You)"}
                        </p>
                        {getRoleBadge(membership.role)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        {userEmail && (
                          <p className="text-sm text-muted-foreground">{userEmail}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(membership.joinedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canChangeRole ? (
                      <Select
                        value={membership.role}
                        onValueChange={(value) =>
                          handleRoleChange(
                            membership._id,
                            value as "owner" | "admin" | "member"
                          )
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="w-32" />
                    )}

                    {canRemove && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(membership._id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {memberships.length === 0 && (
              <p className="py-8 text-center text-muted-foreground">
                No members found
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog
        projectId={projectId}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={() => setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member from the project? They
              will lose access to all project resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
