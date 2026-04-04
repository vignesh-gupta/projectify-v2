"use client"

import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { useTaskId } from "@/hooks/nuqs/use-task-id"
import { Card, CardContent } from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { useQuery } from "convex/react"
import { LayoutGrid, Table } from "lucide-react"
import { useParams } from "next/navigation"
import { useMemo, useState } from "react"
import { CreateTaskDialog } from "./components/create-task-dialog"
import { createTaskColumns } from "./components/task-columns"
import { TaskDataTable } from "./components/task-data-table"
import { TaskDetailSheet } from "./components/task-detail-sheet"
import { TaskKanbanBoard } from "./components/task-kanban-board"

export default function WorkItemsPage() {
  const params = useParams()

  const [taskId, setTaskId] = useTaskId()

  const projectId = params.id as Id<"projects">

  const tasks = useQuery(api.tasks.listByProject, { projectId })
  const isLoading = tasks === undefined

  const columns = createTaskColumns(projectId)
  const [sheetEditable, setSheetEditable] = useState(false)

  const selectedTask = useMemo(
    () => tasks?.find((task) => task._id === taskId) ?? null,
    [taskId, tasks]
  )

  const handleSheetOpenChange = (open: boolean) => {
    if (open) return
    setTaskId(null)
  }

  return (
    <>
      <div className="flex h-full flex-col gap-6 overflow-y-auto p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Work Items</h1>
            <p className="text-muted-foreground">
              Easily create and manage work items to keep track of tasks and
              deliverables.
            </p>
          </div>
          <CreateTaskDialog projectId={projectId} />
        </div>

        <Tabs defaultValue="kanban" className="flex-1">
          <TabsList>
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Kanban Board
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table className="h-4 w-4" />
              Table View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="space-y-3 p-6">
                      <Skeleton className="h-6 w-24" />
                      {[1, 2, 3].map((j) => (
                        <Skeleton key={j} className="h-24 w-full" />
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tasks && tasks.length === 0 ? (
              <Card>
                <CardContent className="flex h-100 items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No tasks yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Get started by creating your first task.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <TaskKanbanBoard
                tasks={tasks || []}
                projectId={projectId}
                isLoading={isLoading}
              />
            )}
          </TabsContent>

          <TabsContent value="table" className="mt-6">
            {tasks && tasks.length === 0 && !isLoading ? (
              <Card>
                <CardContent className="flex h-100 items-center justify-center">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Table className="h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">No tasks yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Get started by creating your first task.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <TaskDataTable
                columns={columns}
                data={tasks || []}
                isLoading={isLoading}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {selectedTask && (
        <TaskDetailSheet
          task={selectedTask}
          projectId={projectId}
          open={Boolean(selectedTask)}
          onOpenChange={handleSheetOpenChange}
          isEditable={selectedTask ? sheetEditable : false}
          onEditableChange={setSheetEditable}
        />
      )}
    </>
  )
}
