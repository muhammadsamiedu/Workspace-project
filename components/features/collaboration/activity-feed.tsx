'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/hooks/useAppRedux';
import { Avatar } from '@/components/ui/avatar';
import { Activity, Clock, Filter } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { ActivityAction } from '@/lib/types';

interface ActivityFeedProps {
  taskId?: string;
  projectId?: string;
  workspaceId?: string;
}

export function ActivityFeed({ taskId, projectId, workspaceId }: ActivityFeedProps) {
  const activities = useAppSelector((state) => state.activity.activities);
  const users = useAppSelector((state) => state.auth.users);

  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredActivities = activities.filter((act) => {
    if (taskId && act.taskId !== taskId) return false;
    if (projectId && act.projectId && act.projectId !== projectId) return false;
    if (workspaceId && act.workspaceId && act.workspaceId !== workspaceId) return false;
    if (filterAction !== 'all' && act.action !== filterAction) return false;
    return true;
  });

  const actionTypes = [
    { id: 'all', label: 'All Actions' },
    { id: 'created_task', label: 'Task Created' },
    { id: 'updated_status', label: 'Status Changed' },
    { id: 'assigned_task', label: 'Assignments' },
    { id: 'commented', label: 'Comments' },
    { id: 'completed_task', label: 'Completions' },
  ];

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-500" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Activity Log ({filteredActivities.length})
          </h4>
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3 h-3 text-zinc-400" />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-[11px] bg-transparent text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 focus:outline-none"
          >
            {actionTypes.map((a) => (
              <option key={a.id} value={a.id} className="dark:bg-zinc-900">
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredActivities.length === 0 ? (
        <p className="text-xs text-zinc-400 py-4 text-center italic">
          No activity recorded yet for this selection.
        </p>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {filteredActivities.map((act) => {
            const user = users.find((u) => u.id === act.userId);
            return (
              <div
                key={act.id}
                className="flex items-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-300 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 last:border-none"
              >
                <Avatar name={user?.name || 'User'} src={user?.avatar} size="xs" className="mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="leading-relaxed">
                    <strong className="text-zinc-900 dark:text-zinc-100 font-semibold mr-1">
                      {user?.name || 'User'}
                    </strong>
                    <span>{act.details}</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatRelativeTime(act.timestamp)}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
