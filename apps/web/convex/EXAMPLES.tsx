/**
 * Example usage of Projectify Convex functions
 * 
 * This file demonstrates how to use the schema and functions.
 * Import these functions in your React components using:
 * 
 * import { api } from "@/convex/_generated/api";
 * import { useMutation, useQuery } from "convex/react";
 */

// ============================================
// PROJECTS
// ============================================

/**
 * Example: Create a new project
 */
export function useCreateProject() {
  // const createProject = useMutation(api.projects.create);
  
  // Example usage:
  const exampleCreate = async () => {
    // const projectId = await createProject({
    //   title: "Website Redesign",
    //   description: "Redesign company website with modern UI",
    //   status: "development",
    //   dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    //   // iconStorageId is optional - omit to show project initials
    // });
  };
}

/**
 * Example: Upload project icon
 */
export function useUploadProjectIcon() {
  // const generateUploadUrl = useMutation(api.projects.generateUploadUrl);
  // const updateProject = useMutation(api.projects.update);

  const exampleUpload = async (file: File, projectId: string) => {
    // 1. Generate upload URL
    // const uploadUrl = await generateUploadUrl();
    
    // 2. Upload file
    // const response = await fetch(uploadUrl, {
    //   method: "POST",
    //   body: file,
    // });
    // const { storageId } = await response.json();
    
    // 3. Update project with storage ID
    // await updateProject({
    //   projectId: projectId as any,
    //   iconStorageId: storageId,
    // });
  };
}

/**
 * Example: List user's projects
 */
export function useListProjects() {
  // const projects = useQuery(api.projects.list);
  
  // projects will be an array like:
  // [
  //   {
  //     _id: "...",
  //     title: "Website Redesign",
  //     description: "...",
  //     status: "development",
  //     dueDate: 1234567890,
  //     iconStorageId: "...",
  //     createdAt: 1234567890,
  //     updatedAt: 1234567890,
  //     role: "owner" // user's role in this project
  //   }
  // ]
}

// ============================================
// TASKS
// ============================================

/**
 * Example: Create a task
 */
export function useCreateTask() {
  // const createTask = useMutation(api.tasks.create);
  
  const exampleCreate = async (projectId: string) => {
    // const taskId = await createTask({
    //   projectId: projectId as any,
    //   title: "Design homepage mockup",
    //   description: "Create initial design concepts for new homepage",
    //   status: "todo",
    //   priority: "high",
    //   dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    //   // assigneeUserId is optional
    // });
  };
}

/**
 * Example: List project tasks
 */
export function useProjectTasks(projectId: string) {
  // const tasks = useQuery(api.tasks.listByProject, { 
  //   projectId: projectId as any 
  // });
  
  // Filter by status:
  // const todoTasks = useQuery(api.tasks.listByProject, { 
  //   projectId: projectId as any,
  //   status: "todo"
  // });
  
  // tasks will be an array like:
  // [
  //   {
  //     _id: "...",
  //     projectId: "...",
  //     title: "Design homepage mockup",
  //     description: "...",
  //     status: "in_progress",
  //     priority: "high",
  //     dueDate: 1234567890,
  //     assigneeUserId: "...",
  //     createdAt: 1234567890,
  //     updatedAt: 1234567890,
  //     createdBy: "..."
  //   }
  // ]
}

/**
 * Example: Update task status
 */
export function useUpdateTask() {
  // const updateTask = useMutation(api.tasks.update);
  
  const exampleUpdate = async (taskId: string) => {
    // Move task to in progress
    // await updateTask({
    //   taskId: taskId as any,
    //   status: "in_progress",
    //   assigneeUserId: "userId123" as any,
    // });
  };
}

// ============================================
// MEMBERSHIPS
// ============================================

/**
 * Example: Add team member to project
 */
export function useAddMember() {
  // const addMember = useMutation(api.memberships.add);
  
  const exampleAdd = async (projectId: string, userId: string) => {
    // await addMember({
    //   projectId: projectId as any,
    //   userId: userId as any,
    //   role: "member", // or "admin" or "owner"
    // });
  };
}

/**
 * Example: List project members
 */
export function useProjectMembers(projectId: string) {
  // const members = useQuery(api.memberships.listByProject, { 
  //   projectId: projectId as any 
  // });
  
  // members will be an array like:
  // [
  //   {
  //     _id: "...",
  //     projectId: "...",
  //     userId: "...",
  //     role: "owner",
  //     joinedAt: 1234567890
  //   }
  // ]
}

// ============================================
// COMPLETE EXAMPLE: Create Project with Tasks
// ============================================

export function useCompleteExample() {
  // const createProject = useMutation(api.projects.create);
  // const createTask = useMutation(api.tasks.create);
  // const addMember = useMutation(api.memberships.add);

  const exampleWorkflow = async () => {
    // 1. Create project
    // const projectId = await createProject({
    //   title: "Mobile App",
    //   description: "Build iOS and Android app",
    //   status: "development",
    // });

    // 2. Add team member
    // await addMember({
    //   projectId,
    //   userId: "user123" as any,
    //   role: "admin",
    // });

    // 3. Create tasks
    // await createTask({
    //   projectId,
    //   title: "Setup React Native",
    //   status: "todo",
    //   priority: "high",
    // });

    // await createTask({
    //   projectId,
    //   title: "Design UI components",
    //   status: "todo",
    //   priority: "medium",
    //   assigneeUserId: "user123" as any,
    // });
  };
}
