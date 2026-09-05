import { WorkspaceAppShell } from '@/components/features/layout/workspace-app-shell';

export const metadata = {
  title: 'Workspaces Explorer — Workspace Manager',
  description: 'Manage workspaces, projects, tasks, and hierarchies',
};

export default function WorkspacesPage() {
  return <WorkspaceAppShell defaultView="hierarchy" />;
}
