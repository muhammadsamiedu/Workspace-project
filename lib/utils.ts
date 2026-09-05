import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TaskPriority, TaskStatus } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(prefix: string = ''): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const id = crypto.randomUUID().slice(0, 8);
    return prefix ? `${prefix}_${id}` : id;
  }
  const randomStr = Math.random().toString(36).substring(2, 10);
  return prefix ? `${prefix}_${randomStr}` : randomStr;
}

export function getInitials(name: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return 'No due date';
  try {
    const date = new Date(dateString);
    // Use a fixed locale to prevent SSR/client hydration mismatch
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  } catch {
    return dateString;
  }
}


export function isDateOverdue(dateString: string | null): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const now = new Date();
    // set to beginning of today
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return date < today;
  } catch {
    return false;
  }
}

export function isDateToday(dateString: string | null): boolean {
  if (!dateString) return false;
  try {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
}

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string; borderColor: string; iconColor: string }
> = {
  urgent: {
    label: 'Urgent',
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 dark:bg-rose-950/40',
    borderColor: 'border-rose-200 dark:border-rose-800/60',
    iconColor: '#f43f5e',
  },
  high: {
    label: 'High',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800/60',
    iconColor: '#f59e0b',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800/60',
    iconColor: '#3b82f6',
  },
  low: {
    label: 'Low',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-800/60',
    borderColor: 'border-zinc-200 dark:border-zinc-700/60',
    iconColor: '#71717a',
  },
};

export const STATUS_CONFIG: Record<string, { label: string; dotColor: string; badgeClass: string }> = {
  todo: {
    label: 'To Do',
    dotColor: 'bg-zinc-400',
    badgeClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  },
  in_progress: {
    label: 'In Progress',
    dotColor: 'bg-indigo-500 animate-pulse',
    badgeClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
  },
  review: {
    label: 'In Review',
    dotColor: 'bg-purple-500',
    badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  },
  done: {
    label: 'Completed',
    dotColor: 'bg-emerald-500',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
};

export function exportToJsonFile(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
