'use client';

import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, openModal, showToast } from '@/redux/slices/uiSlice';
import { loginAs } from '@/redux/slices/authSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Shield,
  Briefcase,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  LogIn,
  ExternalLink,
  Sparkles,
  Layers,
  AlertCircle,
} from 'lucide-react';
import { cn, generateId, PRIORITY_CONFIG } from '@/lib/utils';
import { Role } from '@/lib/types';

export function AllProfilesModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const tasks = useAppSelector((state) => state.tasks.tasks);
  const workspaces = useAppSelector((state) => state.workspaces.workspaces);
  const projects = useAppSelector((state) => state.projects.projects);

  const { canViewAllProfiles, isOwner, isAdmin, isMember } = usePermissions();

  const isOpen = activeModal === 'all_profiles';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [expandedUserTasks, setExpandedUserTasks] = useState<Record<string, boolean>>({});

  // Determine which user profiles are visible:
  // - Owner and Admin: Can view all user profiles across the entire system
  // - Member: Can only view teammates who share at least one workspace with them
  const visibleUsers = useMemo(() => {
    let list = users;
    if (!canViewAllProfiles && currentUser) {
      // Find all workspace IDs the current user belongs to
      const myWorkspaceIds = new Set(
        workspaces
          .filter(
            (w) =>
              w.members.some((m) => m.userId === currentUser.id) ||
              (w as any).ownerId === currentUser.id
          )
          .map((w) => w.id)
      );

      // Filter to users who share at least one workspace with currentUser
      list = users.filter((u) => {
        if (u.id === currentUser.id) return true;
        return workspaces.some(
          (w) =>
            myWorkspaceIds.has(w.id) &&
            w.members.some((m) => m.userId === u.id)
        );
      });
    }

    return list.filter((u) => {
      if (selectedRoleFilter !== 'all' && u.role !== selectedRoleFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchBio = u.bio?.toLowerCase().includes(q) || false;
        return matchName || matchEmail || matchBio;
      }
      return true;
    });
  }, [users, canViewAllProfiles, currentUser, workspaces, selectedRoleFilter, searchQuery]);

  if (!isOpen) return null;

  const toggleExpandTasks = (userId: string) => {
    setExpandedUserTasks((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleSwitchUser = (targetUserId: string, targetName: string) => {
    dispatch(loginAs(targetUserId));
    dispatch(closeModal());
    dispatch(
      showToast({
        id: generateId('toast'),
        message: `Switched active account to ${targetName}. Permissions updated!`,
        type: 'info',
      })
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title="Team Profiles & Directory"
      description={
        isOwner
          ? 'Owner Master Directory: View all member profiles, their assigned workspaces, and inspect their tasks.'
          : isAdmin
          ? 'Admin Directory: View all member & viewer profiles, workspaces, and tasks.'
          : 'Team Directory: Members in your shared workspaces.'
      }
      size="xl"
    >
      <div className="space-y-4 select-none">
        {/* Role Access Banner */}
        <div
          className={cn(
            'p-3 rounded-xl border flex items-center justify-between gap-3 text-xs',
            isOwner
              ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200'
              : isAdmin
              ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-900 dark:text-purple-200'
              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
          )}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>
              {isOwner ? (
                <>
                  <strong className="font-bold">Owner Master Access:</strong> You can view all team
                  members, their bios, assigned workspaces, and all their active tasks.
                </>
              ) : isAdmin ? (
                <>
                  <strong className="font-bold">Admin Directory:</strong> You can view member and
                  viewer profiles, workspaces, and tasks.
                </>
              ) : (
                <>
                  <strong className="font-bold">Member View:</strong> Showing teammates belonging
                  to your assigned workspaces.
                </>
              )}
            </span>
          </div>

          <Badge
            variant={isOwner ? 'indigo' : isAdmin ? 'purple' : 'default'}
            size="sm"
          >
            {currentUser.role.toUpperCase()}
          </Badge>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5 pointer-events-none" />
            <Input
              placeholder="Search by member name, email, or bio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg shrink-0">
            {['all', 'owner', 'admin', 'member', 'viewer'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRoleFilter(role)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors cursor-pointer',
                  selectedRoleFilter === role
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                )}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Users Profiles List */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {visibleUsers.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                No team profiles found matching your search.
              </p>
            </div>
          ) : (
            visibleUsers.map((user) => {
              const isMe = user.id === currentUser.id;

              // Member's workspaces
              const userWorkspaces = workspaces.filter(
                (w) =>
                  w.members.some((m) => m.userId === user.id) ||
                  (w as any).ownerId === user.id
              );

              // Member's tasks
              const userTasks = tasks.filter((t) => t.assigneeId === user.id);
              const userDoneTasks = userTasks.filter((t) => t.status === 'done').length;
              const userInProgressTasks = userTasks.filter((t) => t.status === 'in_progress').length;
              const isExpanded = !!expandedUserTasks[user.id];

              return (
                <div
                  key={user.id}
                  className={cn(
                    'p-4 rounded-2xl border transition-all',
                    isMe
                      ? 'border-indigo-300 dark:border-indigo-800/80 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700'
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* User Info Header */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <Avatar name={user.name} src={user.avatar} size="md" />

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {user.name}
                          </h4>
                          {isMe && (
                            <Badge variant="indigo" size="sm">
                              You
                            </Badge>
                          )}
                          <Badge
                            variant={
                              user.role === 'owner'
                                ? 'indigo'
                                : user.role === 'admin'
                                ? 'purple'
                                : user.role === 'member'
                                ? 'default'
                                : 'rose'
                            }
                            size="sm"
                          >
                            {user.role.toUpperCase()}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-400 truncate">{user.email}</p>

                        {user.bio && (
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 pt-0.5 line-clamp-2 leading-relaxed">
                            {user.bio}
                          </p>
                        )}

                        {/* Associated Workspaces Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400">
                            Workspaces:
                          </span>
                          {userWorkspaces.length === 0 ? (
                            <span className="text-[11px] text-zinc-400">None assigned</span>
                          ) : (
                            userWorkspaces.map((ws) => (
                              <span
                                key={ws.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: ws.color || '#6366f1' }}
                                />
                                {ws.name}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {!isMe && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleSwitchUser(user.id, user.name)}
                          className="text-xs text-zinc-700 dark:text-zinc-300"
                          leftIcon={<LogIn className="w-3.5 h-3.5" />}
                        >
                          Switch Account
                        </Button>
                      )}

                      {/* Expand / Collapse Tasks Button */}
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => toggleExpandTasks(user.id)}
                        className="text-xs"
                      >
                        <span>{userTasks.length} Tasks</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 ml-1" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 ml-1" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Tasks Summary Strip */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Total Tasks:</span>
                      <strong className="font-bold text-zinc-900 dark:text-zinc-100">
                        {userTasks.length}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>In Progress:</span>
                      <strong className="font-bold text-zinc-900 dark:text-zinc-100">
                        {userInProgressTasks}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Completed:</span>
                      <strong className="font-bold text-zinc-900 dark:text-zinc-100">
                        {userDoneTasks}
                      </strong>
                    </div>
                  </div>

                  {/* Expanded Task List View for Owner/Admin inspection */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                        <span>Tasks Assigned to {user.name} ({userTasks.length})</span>
                      </div>

                      {userTasks.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-2">
                          No tasks currently assigned to this user.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {userTasks.map((task) => {
                            const taskProject = projects.find((p) => p.id === task.projectId);
                            const pConfig =
                              PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

                            return (
                              <div
                                key={task.id}
                                onClick={() => {
                                  dispatch(closeModal());
                                  dispatch(
                                    openModal({
                                      name: 'task_detail',
                                      data: { taskId: task.id },
                                    })
                                  );
                                }}
                                className="p-2 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                              >
                                <div className="min-w-0 flex items-center gap-2 flex-1">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: taskProject?.color || '#6366f1' }}
                                  />
                                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {task.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-zinc-400 truncate max-w-[120px]">
                                    {taskProject?.name}
                                  </span>

                                  <Badge
                                    variant={
                                      task.status === 'done'
                                        ? 'emerald'
                                        : task.status === 'in_progress'
                                        ? 'indigo'
                                        : 'outline'
                                    }
                                    size="sm"
                                  >
                                    {task.status.replace('_', ' ').toUpperCase()}
                                  </Badge>

                                  <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
