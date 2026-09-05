'use client';

import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { addComment, updateComment, deleteComment } from '@/redux/slices/commentSlice';
import { logActivity } from '@/redux/slices/activitySlice';
import { addNotification } from '@/redux/slices/notificationSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Trash2, Edit2, Check, X, AtSign } from 'lucide-react';
import { generateId, formatRelativeTime, cn } from '@/lib/utils';
import { User } from '@/lib/types';

interface CommentThreadProps {
  taskId: string;
  taskTitle: string;
}

export function CommentThread({ taskId, taskTitle }: CommentThreadProps) {
  const dispatch = useAppDispatch();
  const comments = useAppSelector((state) => state.comments.comments);
  const users = useAppSelector((state) => state.auth.users);
  const currentUser = useAppSelector((state) => state.auth.currentUser);
  const activeWorkspaceId = useAppSelector((state) => state.workspaces.activeWorkspaceId);

  const { canComment, isViewer } = usePermissions();

  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // @mention state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const taskComments = comments.filter((c) => c.taskId === taskId);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewComment(val);

    // Check for `@` trigger
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtMatch = textBeforeCursor.match(/@(\w*)$/);
    if (lastAtMatch) {
      setMentionQuery(lastAtMatch[1].toLowerCase());
      setMentionPosition(cursorPos);
    } else {
      setMentionQuery(null);
    }
  };

  const handleInsertMention = (user: User) => {
    if (!textareaRef.current) return;
    const val = newComment;
    const beforeMention = val.slice(0, val.lastIndexOf('@'));
    const afterMention = val.slice(textareaRef.current.selectionStart);
    const updated = `${beforeMention}@${user.name} ${afterMention}`;

    setNewComment(updated);
    setMentionQuery(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !canComment) return;

    const commentId = generateId('comm');
    dispatch(
      addComment({
        id: commentId,
        taskId,
        userId: currentUser.id,
        content: newComment.trim(),
        createdAt: new Date().toISOString(),
      })
    );

    // Audit log
    dispatch(
      logActivity({
        id: generateId('act'),
        workspaceId: activeWorkspaceId,
        taskId,
        taskTitle,
        userId: currentUser.id,
        action: 'commented',
        details: `Added a comment on "${taskTitle}"`,
        timestamp: new Date().toISOString(),
      })
    );

    // Check if another user was mentioned in comment
    users.forEach((u) => {
      if (u.id !== currentUser.id && newComment.includes(`@${u.name}`)) {
        dispatch(
          addNotification({
            id: generateId('notif'),
            userId: u.id,
            type: 'mentioned',
            title: 'Mentioned in a comment',
            message: `${currentUser.name} mentioned you in "${taskTitle}"`,
            taskId,
            workspaceId: activeWorkspaceId,
            read: false,
            createdAt: new Date().toISOString(),
          })
        );
      }
    });

    setNewComment('');
  };

  const filteredMentionUsers = mentionQuery !== null
    ? users.filter((u) => u.name.toLowerCase().includes(mentionQuery))
    : [];

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-indigo-500" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
          Comments & Discussion ({taskComments.length})
        </h4>
      </div>

      {/* Comment List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {taskComments.length === 0 ? (
          <p className="text-xs text-zinc-400 py-3 italic">
            No comments yet. Start the conversation below!
          </p>
        ) : (
          taskComments.map((c) => {
            const author = users.find((u) => u.id === c.userId);
            const isMe = c.userId === currentUser.id;
            const isEditing = editingCommentId === c.id;

            return (
              <div
                key={c.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-2xs group"
              >
                <Avatar
                  name={author?.name || 'User'}
                  src={author?.avatar}
                  size="sm"
                  className="mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {author?.name || 'User'}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {formatRelativeTime(c.createdAt)}
                      </span>
                    </div>

                    {isMe && !isEditing && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditingContent(c.content);
                          }}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => dispatch(deleteComment(c.id))}
                          className="p-1 text-zinc-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 mt-1">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingCommentId(null)}
                          className="px-2 py-0.5 text-xs text-zinc-500 hover:text-zinc-800"
                        >
                          Cancel
                        </button>
                        <Button
                          size="xs"
                          onClick={() => {
                            dispatch(updateComment({ id: c.id, content: editingContent }));
                            setEditingCommentId(null);
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {c.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Comment Input with @Mention Autocomplete */}
      {canComment && (
        <form onSubmit={handleSubmit} className="relative space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          {/* Autocomplete Dropdown */}
          {mentionQuery !== null && filteredMentionUsers.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1 w-60 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden glass-panel">
              <div className="p-1.5 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800">
                Mention Teammate
              </div>
              <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredMentionUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleInsertMention(u)}
                    className="w-full flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                  >
                    <Avatar name={u.name} src={u.avatar} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              rows={2}
              placeholder="Write a comment... (Type @ to mention someone)"
              value={newComment}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            <Button
              type="submit"
              disabled={!newComment.trim()}
              size="sm"
              className="self-end"
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
