import { WorkspaceAppShell } from '@/components/features/layout/workspace-app-shell';

export const metadata = {
  title: 'Task List — Workspace Manager',
  description: 'Detailed list view of tasks and priorities',
};

export default function ListPage() {
  return <WorkspaceAppShell defaultView="list" />;
}
