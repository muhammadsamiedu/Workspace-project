import { WorkspaceAppShell } from '@/components/features/layout/workspace-app-shell';

export const metadata = {
  title: 'Workspace Manager — Project & Task Management',
  description:
    'A production-grade, fast project & task management workspace inspired by Linear, Notion, and Jira.',
};

export default function HomePage() {
  return <WorkspaceAppShell />;
}
