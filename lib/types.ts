export type Role = 'owner' | 'admin' | 'member' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  bio?: string;
  initials?: string;
}

export type ViewType = 'kanban' | 'list' | 'calendar' | 'hierarchy' | 'overview';
export type GroupBy = 'none' | 'status' | 'assignee' | 'priority' | 'label';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | string;

export interface WorkspaceMember {
  userId: string;
  role: Role;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  icon: string;
  color: string;
  defaultView: ViewType;
  members: WorkspaceMember[];
  createdAt: string;
}

export interface ProjectColumn {
  id: string;
  title: string;
  color?: string;
  wipLimit?: number;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: 'active' | 'archived';
  memberIds: string[];
  columns: ProjectColumn[];
  defaultView: ViewType;
  template?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  tags: string[];
  subtasks: Subtask[];
  attachments: Attachment[];
  order: number;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export type ActivityAction =
  | 'created_task'
  | 'updated_task'
  | 'updated_status'
  | 'moved_task'
  | 'deleted_task'
  | 'completed_task'
  | 'subtask_toggled'
  | 'added_subtask'
  | 'commented'
  | 'assigned_task'
  | 'created_project'
  | 'updated_project'
  | 'invited_member'
  | 'restored_task';

export interface ActivityLogItem {
  id: string;
  workspaceId: string;
  projectId?: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  action: ActivityAction;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export type NotificationType = 'assigned' | 'mentioned' | 'due_soon' | 'system';

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  projectId?: string;
  workspaceId?: string;
  read: boolean;
  createdAt: string;
}

export interface FilterState {
  search: string;
  assigneeId: string | null;
  status: string[];
  priority: TaskPriority[];
  tags: string[];
  dueDateRange: 'all' | 'overdue' | 'today' | 'this_week' | 'no_date';
  sortBy: 'dueDate' | 'priority' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export interface FilterPreset {
  id: string;
  name: string;
  icon?: string;
  isCustom?: boolean;
  filters: Partial<FilterState>;
}

export interface NotificationPreferences {
  assigned: boolean;
  mentioned: boolean;
  dueSoon: boolean;
  system: boolean;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  actionType: 'task_update' | 'task_delete' | 'task_create' | 'task_move';
  undoData: any;
  redoData: any;
}
