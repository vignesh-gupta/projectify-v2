import { ProjectSidebar } from "@/components/project-sidebar"
import { Id } from "@/convex/_generated/dataModel"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { ReactNode } from "react"

interface ProjectLayoutProps {
  children: ReactNode
  params: Promise<{ id: string }>
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { id } = await params

  return (
    <SidebarProvider className="items-stretch">
      <ProjectSidebar projectId={id as Id<"projects">} />
      <SidebarInset className="flex flex-col overflow-y-auto bg-sidebar px-1 py-1.5 min-h-full">
        <div className="flex-1 rounded-[20] bg-background">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
