"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@workspace/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"
import { useQuery } from "convex/react"
import { Check, ChevronsUpDown, User, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@workspace/ui/lib/utils"

interface AssigneeSelectorProps {
  projectId: Id<"projects">
  value?: Id<"users">
  onChange: (value: Id<"users"> | undefined) => void
  disabled?: boolean
  placeholder?: string
  allowClear?: boolean
}

export function AssigneeSelector({
  projectId,
  value,
  onChange,
  disabled = false,
  placeholder = "Select assignee",
  allowClear = true,
}: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const members = useQuery(api.mentions.getProjectMembers, {
    projectId,
    searchQuery: search || undefined,
  })

  const selectedMember = members?.find((m) => m._id === value)

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value && selectedMember ? (
            <div className="flex items-center gap-2">
              {selectedMember.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedMember.image}
                  alt={selectedMember.name || "User"}
                  className="size-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex size-5 items-center justify-center rounded-full bg-muted">
                  <User className="size-3" />
                </div>
              )}
              <span className="truncate">
                {selectedMember.name || selectedMember.email}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1">
            {value && allowClear && !disabled && (
              <X
                className="size-4 shrink-0 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search members..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {members === undefined ? "Loading..." : "No members found."}
            </CommandEmpty>
            {members && members.length > 0 && (
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member._id}
                    value={member._id}
                    onSelect={() => {
                      onChange(member._id as Id<"users">)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        value === member._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex items-center gap-2">
                      {member.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.image}
                          alt={member.name || "User"}
                          className="size-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex size-6 items-center justify-center rounded-full bg-muted">
                          <User className="size-3" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {member.name || member.email}
                        </span>
                        {member.name && member.email && (
                          <span className="text-xs text-muted-foreground">
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
