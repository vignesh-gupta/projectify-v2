import { ProjectSidebar } from "@/components/project-sidebar"
import { Id } from "@/convex/_generated/dataModel"
import { SidebarInset, SidebarProvider } from "@workspace/ui/components/sidebar"
import { ReactNode } from "react"

interface ProjectLayoutProps {
  children: ReactNode
  params: Promise<{ id: Id<"projects"> }>
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { id } = await params

  return (
    <SidebarProvider>
      <ProjectSidebar projectId={id} />
      <SidebarInset>
        <main className="flex h-full flex-1 flex-col overflow-y-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
