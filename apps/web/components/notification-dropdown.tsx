"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { useMutation, useQuery } from "convex/react"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  Check,
  CheckCheck,
  MessageSquare,
  UserMinus,
  UserPlus,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function NotificationDropdown() {
  const router = useRouter()
  const notifications = useQuery(api.notifications.list, { limit: 20 })
  const unreadCount = useQuery(api.notifications.getUnreadCount)
  const markAsRead = useMutation(api.notifications.markAsRead)
  const markAllAsRead = useMutation(api.notifications.markAllAsRead)

  const handleNotificationClick = async (
    notificationId: Id<"notifications">,
    type: string,
    taskId: Id<"tasks"> | undefined,
    projectId: Id<"projects">,
    isRead: boolean
  ) => {
    // Mark as read if not already
    if (!isRead) {
      try {
        await markAsRead({ notificationId })
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    }

    // Navigate to task
    if (taskId) {
      router.push(`/project/${projectId}/work-items`)
      return
    }

    if (type === "message_mentioned") {
      router.push(`/project/${projectId}/messages`)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead()
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark notifications as read")
      console.error(error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "task_assigned":
        return <UserPlus className="size-4 text-green-500" />
      case "task_unassigned":
        return <UserMinus className="size-4 text-orange-500" />
      case "task_status_changed":
        return <Check className="size-4 text-blue-500" />
      case "message_mentioned":
        return <MessageSquare className="size-4 text-violet-500" />
      default:
        return <Bell className="size-4 text-muted-foreground" />
    }
  }

  const getNotificationMessage = (notification: {
    type: string
    triggeredByUser: { name: string | null; email: string } | null
    metadata?: {
      taskTitle?: string
      oldStatus?: string
      newStatus?: string
      messagePreview?: string
    }
  }) => {
    const userName =
      notification.triggeredByUser?.name ||
      notification.triggeredByUser?.email ||
      "Someone"
    const taskTitle = notification.metadata?.taskTitle || "a task"

    switch (notification.type) {
      case "task_assigned":
        return (
          <>
            <span className="font-medium">{userName}</span> assigned you to{" "}
            <span className="font-medium">{taskTitle}</span>
          </>
        )
      case "task_unassigned":
        return (
          <>
            <span className="font-medium">{userName}</span> removed you from{" "}
            <span className="font-medium">{taskTitle}</span>
          </>
        )
      case "task_status_changed":
        return (
          <>
            <span className="font-medium">{userName}</span> changed the status
            of <span className="font-medium">{taskTitle}</span>
          </>
        )
      case "message_mentioned":
        return (
          <>
            <span className="font-medium">{userName}</span> mentioned you in a
            message
            {notification.metadata?.messagePreview ? (
              <>
                :{" "}
                <span className="font-medium">
                  {notification.metadata.messagePreview}
                </span>
              </>
            ) : null}
          </>
        )
      default:
        return "New notification"
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount !== undefined && unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-96">
        <div className="flex items-center justify-between px-4 py-2">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount !== undefined && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <CheckCheck className="mr-1 size-3" />
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {!notifications ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8">
              <Bell className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification._id}
                  className={`flex cursor-pointer flex-col items-start gap-2 p-3 ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                  onClick={() =>
                    handleNotificationClick(
                      notification._id,
                      notification.type,
                      notification.taskId,
                      notification.projectId,
                      notification.isRead
                    )
                  }
                >
                  <div className="flex w-full items-start gap-2">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight">
                        {getNotificationMessage(notification)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {notification.project && (
                          <span>{notification.project.title}</span>
                        )}
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(notification.createdAt, {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    {!notification.isRead && (
                      <div className="mt-1.5 size-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
