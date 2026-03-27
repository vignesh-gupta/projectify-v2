"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { toast } from "sonner"
import { IconSelector } from "./icon-selector"
import { Loader2 } from "lucide-react"

interface GeneralSettingsProps {
  project: {
    _id: Id<"projects">
    title: string
    description: string
    status: "development" | "maintenance" | "inactive"
    dueDate?: number
    iconStorageId?: Id<"_storage">
    iconName?: string
  }
  isReadOnly?: boolean
}

interface FormData {
  title: string
  description: string
  status: "development" | "maintenance" | "inactive"
  dueDate?: string
}

export function GeneralSettings({ project, isReadOnly = false }: GeneralSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [iconData, setIconData] = useState<{
    storageId?: Id<"_storage">
    name?: string
  }>({
    storageId: project.iconStorageId,
    name: project.iconName,
  })
  const [iconChanged, setIconChanged] = useState(false)

  const updateProject = useMutation(api.projects.update)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      title: project.title,
      description: project.description,
      status: project.status,
      dueDate: project.dueDate
        ? new Date(project.dueDate).toISOString().split("T")[0]
        : undefined,
    },
  })

  const status = watch("status")

  // Handler for icon changes
  const handleIconChange = (icon: { storageId?: Id<"_storage">; name?: string }) => {
    setIconData(icon)
    setIconChanged(true)
  }

  // Check if any changes have been made (form fields or icon)
  const hasChanges = isDirty || iconChanged

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const updateData = {
        projectId: project._id,
        title: data.title,
        description: data.description,
        status: data.status,
        dueDate: data.dueDate ? new Date(data.dueDate).getTime() : undefined,
      } as {
        projectId: Id<"projects">
        title?: string
        description?: string
        status?: "development" | "maintenance" | "inactive"
        dueDate?: number
        iconStorageId?: Id<"_storage">
        iconName?: string
      }

      // Handle icon updates
      if (iconData.storageId) {
        updateData.iconStorageId = iconData.storageId
        updateData.iconName = undefined // Clear icon name if storage is used
      } else if (iconData.name) {
        updateData.iconName = iconData.name
        updateData.iconStorageId = undefined // Clear storage if icon name is used
      }

      await updateProject(updateData)
      toast.success("Project settings updated successfully")
      setIconChanged(false) // Reset icon changed flag after successful save
    } catch (error) {
      console.error("Failed to update project:", error)
      toast.error("Failed to update project settings")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>
            Update your project&apos;s basic information and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Project Name</Label>
            <Input
              id="title"
              {...register("title", { required: "Project name is required" })}
              placeholder="Enter project name"
              disabled={isReadOnly}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description", {
                required: "Description is required",
              })}
              placeholder="Describe your project..."
              rows={4}
              disabled={isReadOnly}
            />
            {errors.description && (
              <p className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Project Status</Label>
              <Select
                value={status}
                onValueChange={(value) =>
                  setValue("status", value as "development" | "maintenance" | "inactive", { shouldDirty: true })
                }
                disabled={isReadOnly}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} disabled={isReadOnly} />
            </div>
          </div>
        </CardContent>
      </Card>

      {!isReadOnly && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Project Icon</CardTitle>
              <CardDescription>
                Choose a predefined icon or upload your own custom image
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IconSelector
                currentIconStorageId={project.iconStorageId}
                currentIconName={project.iconName}
                onIconChange={handleIconChange}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || !hasChanges}
            >
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </>
      )}

      {isReadOnly && (
        <Card>
          <CardHeader>
            <CardTitle>Project Icon</CardTitle>
            <CardDescription>
              Current project icon (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {project.iconName ? `Icon: ${project.iconName}` : project.iconStorageId ? "Custom uploaded image" : "No icon set"}
            </p>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
