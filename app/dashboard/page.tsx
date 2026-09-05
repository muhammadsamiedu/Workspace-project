import { WorkspaceAppShell } from '@/components/features/layout/workspace-app-shell';

export const metadata = {
  title: 'Dashboard — Workspace Manager',
  description: 'General workspace dashboard and performance metrics',
};

export default function DashboardPage() {
  return <WorkspaceAppShell defaultView="overview" />;
}
