import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-md animate-shimmer bg-zinc-200 dark:bg-zinc-800/80', className)}
      {...props}
    />
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  );
}
