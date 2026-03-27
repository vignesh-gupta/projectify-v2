"use client"

import { useState, useRef } from "react"
import { Upload, Search, X } from "lucide-react"
import * as Icons from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { toast } from "sonner"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

interface IconSelectorProps {
  currentIconStorageId?: Id<"_storage">
  currentIconName?: string
  onIconChange: (icon: { storageId?: Id<"_storage">; name?: string }) => void
}

// Popular icons for projects
const POPULAR_ICONS = [
  "Folder",
  "FolderOpen",
  "Box",
  "Package",
  "Briefcase",
  "Rocket",
  "Target",
  "Zap",
  "Star",
  "Heart",
  "Code",
  "Terminal",
  "Database",
  "Cloud",
  "Globe",
  "Settings",
  "Tool",
  "Wrench",
  "Hammer",
  "Cpu",
]

export function IconSelector({
  currentIconStorageId,
  currentIconName,
  onIconChange,
}: IconSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<"upload" | "picker">("picker")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedIconName, setSelectedIconName] = useState<string | undefined>(
    currentIconName
  )
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateUploadUrl = useMutation(api.projects.generateUploadUrl)

  // Filter icons based on search
  const filteredIcons = searchQuery
    ? POPULAR_ICONS.filter((name) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : POPULAR_ICONS

  const handleIconSelect = (iconName: string) => {
    setSelectedIconName(iconName)
    // Clear uploaded file when selecting a predefined icon
    setUploadedFile(null)
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    // Pass only the icon name, storageId will be undefined (cleared)
    onIconChange({ name: iconName, storageId: undefined })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB")
      return
    }

    setUploadedFile(file)
    // Clear selected icon name when uploading a file
    setSelectedIconName(undefined)

    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!uploadedFile) return

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Upload file
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": uploadedFile.type },
        body: uploadedFile,
      })

      if (!result.ok) {
        throw new Error("Upload failed")
      }

      const { storageId } = await result.json()

      // Pass only the storageId, name will be undefined (cleared)
      onIconChange({ storageId: storageId as Id<"_storage">, name: undefined })
      toast.success("Icon uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload icon")
    }
  }

  const clearSelection = () => {
    setSelectedIconName(undefined)
    setUploadedFile(null)
    setPreviewUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const renderIcon = (iconName: string, size: number = 24) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (Icons as any)[iconName] as React.ComponentType<{ size: number }> | undefined
    if (!IconComponent) return null
    return <IconComponent size={size} />
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as "upload" | "picker")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="picker">Icon Picker</TabsTrigger>
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
        </TabsList>

        <TabsContent value="picker" className="space-y-4">
          <div className="space-y-2">
            <Label>Search Icons</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search for an icon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {selectedIconName && (
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary/10">
                {renderIcon(selectedIconName, 20)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Selected: {selectedIconName}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                <X className="size-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="h-[300px] rounded-md border p-4">
            <div className="grid grid-cols-6 gap-2">
              {filteredIcons.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => handleIconSelect(iconName)}
                  className={`flex size-12 items-center justify-center rounded-md border transition-colors hover:bg-accent ${
                    selectedIconName === iconName
                      ? "border-primary bg-primary/10"
                      : "border-border"
                  }`}
                  title={iconName}
                >
                  {renderIcon(iconName, 20)}
                </button>
              ))}
            </div>
            {filteredIcons.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No icons found
              </p>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="space-y-2">
            <Label>Upload Custom Icon</Label>
            <p className="text-sm text-muted-foreground">
              Select an image file (PNG, JPG, or SVG). Max size: 5MB
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {previewUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 rounded-lg border p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Icon preview"
                    className="size-16 rounded-md object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{uploadedFile?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {uploadedFile?.size
                        ? `${(uploadedFile.size / 1024).toFixed(2)} KB`
                        : ""}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSelection}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

                <Button onClick={handleUpload} className="w-full">
                  <Upload className="mr-2 size-4" />
                  Upload Icon
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="h-32 w-full"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-8 text-muted-foreground" />
                  <span className="text-sm">Choose an image</span>
                </div>
              </Button>
            )}
          </div>

          {currentIconStorageId && !previewUrl && (
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">
                Current icon is a custom uploaded image
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
