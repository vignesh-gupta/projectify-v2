"use client"

import { useMutation } from "convex/react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useState } from "react"
import { api } from "@/convex/_generated/api"
import { Doc, Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { KanbanColumn } from "./kanban-column"
import { TaskCard } from "./task-card"
import { Skeleton } from "@workspace/ui/components/skeleton"

type Task = Doc<"tasks">
type TaskStatus = "todo" | "in_progress" | "done"

interface TaskKanbanBoardProps {
  tasks: Task[]
  projectId: Id<"projects">
  isLoading?: boolean
}

const columns: { id: TaskStatus; title: string }[] = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "done", title: "Done" },
]

export function TaskKanbanBoard({ tasks, projectId, isLoading }: TaskKanbanBoardProps) {
  const [activeId, setActiveId] = useState<Id<"tasks"> | null>(null)
  const updateTask = useMutation(api.tasks.update)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as Id<"tasks">)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const taskId = active.id as Id<"tasks">
    const newStatus = over.id as TaskStatus

    // Find the task to check if status actually changed
    const task = tasks.find((t) => t._id === taskId)
    if (task && task.status !== newStatus) {
      try {
        await updateTask({
          taskId,
          status: newStatus,
        })
      } catch (error) {
        console.error("Failed to update task status:", error)
      }
    }

    setActiveId(null)
  }

  const handleDragCancel = () => {
    setActiveId(null)
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  const activeTask = activeId ? tasks.find((task) => task._id === activeId) : null

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((column) => (
          <Card key={column.id}>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id)
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              count={columnTasks.length}
            >
              <SortableContext items={columnTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <TaskCard key={task._id} task={task} projectId={projectId} />
                  ))}
                </div>
              </SortableContext>
            </KanbanColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} projectId={projectId} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}
