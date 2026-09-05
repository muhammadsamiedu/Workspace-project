import { WorkspaceAppShell } from '@/components/features/layout/workspace-app-shell';

export const metadata = {
  title: 'Kanban Board — Workspace Manager',
  description: 'Interactive agile Kanban board view',
};

export default function KanbanPage() {
  return <WorkspaceAppShell defaultView="kanban" />;
}
