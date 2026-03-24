"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"

export function AccountSettings() {
  const user = useQuery(api.auth.currentUser)
  const updateProfile = useMutation(api.users.updateProfile)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form when user data loads
  const isLoading = user === undefined
  const initialized = user && !name && !email

  if (initialized) {
    setName(user.name || "")
    setEmail(user.email || "")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Name is required")
      return
    }

    if (!email.trim()) {
      toast.error("Email is required")
      return
    }

    setIsSubmitting(true)

    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
      })

      toast.success("Profile updated successfully!")
    } catch (error) {
      console.error("Failed to update profile:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="size-20 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse bg-muted" />
              <div className="h-3 w-48 animate-pulse bg-muted" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 animate-pulse bg-muted" />
            <div className="h-10 animate-pulse bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Update your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">
            Failed to load user data. Please try refreshing the page.
          </div>
        </CardContent>
      </Card>
    )
  }

  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src={user.image} alt={name || "User"} />
              <AvatarFallback className="text-lg">
                {user.image ? <User className="size-8" /> : initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-foreground">{name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled
              >
                Change Photo (Coming Soon)
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Email changes may require re-authentication
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
