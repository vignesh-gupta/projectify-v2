"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
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
  const generateProfileImageUploadUrl = useMutation(
    api.users.generateProfileImageUploadUrl
  )
  const updateProfileImage = useMutation(api.users.updateProfileImage)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [hasInitializedForm, setHasInitializedForm] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const isLoading = user === undefined

  useEffect(() => {
    if (!user || hasInitializedForm) {
      return
    }

    setName(user.name || "")
    setEmail(user.email || "")
    setHasInitializedForm(true)
  }, [user, hasInitializedForm])

  const handleProfileImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file")
      event.target.value = ""
      return
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error("Image size must be 5MB or less")
      event.target.value = ""
      return
    }

    setIsUploadingImage(true)

    try {
      const uploadUrl = await generateProfileImageUploadUrl()
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      })

      if (!response.ok) {
        throw new Error("Failed to upload profile image")
      }

      const { storageId } = (await response.json()) as {
        storageId?: Id<"_storage">
      }
      if (!storageId) {
        throw new Error("Upload did not return a storageId")
      }

      await updateProfileImage({ storageId })
      toast.success("Profile picture updated successfully!")
    } catch (error) {
      console.error("Failed to update profile picture:", error)
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update profile picture. Please try again."
      )
    } finally {
      setIsUploadingImage(false)
      event.target.value = ""
    }
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
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileImageChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={isUploadingImage || isSubmitting}
                onClick={() => imageInputRef.current?.click()}
              >
                {isUploadingImage && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {isUploadingImage ? "Uploading..." : "Change Photo"}
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
