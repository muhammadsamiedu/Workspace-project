import { WorkspaceAppShell } from '@/components/features/layout/workspace-app-shell';

export const metadata = {
  title: 'Calendar View — Workspace Manager',
  description: 'Timeline and calendar view of scheduled tasks',
};

export default function CalendarPage() {
  return <WorkspaceAppShell defaultView="calendar" />;
}
