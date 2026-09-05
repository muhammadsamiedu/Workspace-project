'use client';

import React, { useState, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { setSimulateError } from '@/redux/slices/taskSlice';
import { setWorkspaces } from '@/redux/slices/workspaceSlice';
import { setProjects } from '@/redux/slices/projectSlice';
import { setTasks } from '@/redux/slices/taskSlice';
import { setComments } from '@/redux/slices/commentSlice';
import { setActivities } from '@/redux/slices/activitySlice';
import { setNotifications } from '@/redux/slices/notificationSlice';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Download,
  Upload,
  RotateCcw,
  ShieldAlert,
  Database,
  Radio,
  FileCheck,
} from 'lucide-react';
import { exportToJsonFile, generateId } from '@/lib/utils';
import {
  INITIAL_WORKSPACES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_COMMENTS,
  INITIAL_ACTIVITY,
  INITIAL_NOTIFICATIONS,
} from '@/lib/seedData';
import { clearAllAppData } from '@/lib/storage';
import { idbManager } from '@/lib/indexedDb';

export function ExportImportModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const state = useAppSelector((state) => state);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const isOpen = activeModal === 'export_import';

  if (!isOpen) return null;

  const handleExport = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      workspaces: state.workspaces.workspaces,
      projects: state.projects.projects,
      tasks: state.tasks.tasks,
      comments: state.comments.comments,
      activity: state.activity.activities,
      notifications: state.notifications.notifications,
    };

    exportToJsonFile(backupData, `workspace-backup-${new Date().toISOString().split('T')[0]}.json`);
    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'Workspace data exported successfully to JSON',
        type: 'success',
      })
    );
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.workspaces || !json.projects || !json.tasks) {
          throw new Error('Invalid schema: Missing required workspace or task arrays.');
        }

        dispatch(setWorkspaces(json.workspaces));
        dispatch(setProjects(json.projects));
        dispatch(setTasks(json.tasks));
        if (json.comments) dispatch(setComments(json.comments));
        if (json.activity) dispatch(setActivities(json.activity));
        if (json.notifications) dispatch(setNotifications(json.notifications));

        dispatch(
          showToast({
            id: generateId('toast'),
            message: 'Imported workspace data successfully!',
            type: 'success',
          })
        );
        dispatch(closeModal());
      } catch (err: any) {
        dispatch(
          showToast({
            id: generateId('toast'),
            message: `Import failed: ${err.message}`,
            type: 'error',
          })
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = async () => {
    clearAllAppData();
    await idbManager.clearDatabase();

    dispatch(setWorkspaces(INITIAL_WORKSPACES));
    dispatch(setProjects(INITIAL_PROJECTS));
    dispatch(setTasks(INITIAL_TASKS));
    dispatch(setComments(INITIAL_COMMENTS));
    dispatch(setActivities(INITIAL_ACTIVITY));
    dispatch(setNotifications(INITIAL_NOTIFICATIONS));

    setConfirmResetOpen(false);
    dispatch(closeModal());
    dispatch(
      showToast({
        id: generateId('toast'),
        message: 'All application data reset to initial demo state.',
        type: 'info',
      })
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => dispatch(closeModal())}
        title="Data Backup & Persistence"
        description="Export JSON backup, import data, or test optimistic UI rollback"
        size="md"
      >
        <div className="space-y-4 select-none">
          {/* Export & Import Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
              <div>
                <Download className="w-5 h-5 text-indigo-500 mb-2" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Export Backup
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 mb-3">
                  Download all workspaces, projects, tasks, comments, and activity as JSON.
                </p>
              </div>
              <Button size="xs" onClick={handleExport} leftIcon={<Download className="w-3.5 h-3.5" />}>
                Export JSON
              </Button>
            </div>

            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between">
              <div>
                <Upload className="w-5 h-5 text-emerald-500 mb-2" />
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  Import Backup
                </h4>
                <p className="text-[11px] text-zinc-400 mt-1 mb-3">
                  Upload a previously exported JSON backup file with automatic validation.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <Button
                size="xs"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload File
              </Button>
            </div>
          </div>

          {/* Optimistic UI & Error Rollback Simulation Toggle */}
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Simulate Network Glitch (Rollback Demo)
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Forces task movements to fail after 400ms to demonstrate optimistic UI rollback.
                  </p>
                </div>
              </div>

              <input
                type="checkbox"
                checked={state.tasks.shouldSimulateError}
                onChange={(e) => dispatch(setSimulateError(e.target.checked))}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Danger Zone: Reset Data */}
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-950/80 bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" />
                Reset App Data
              </h4>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Clear all custom entries and revert to the rich default seed dataset.
              </p>
            </div>

            <Button
              variant="danger"
              size="xs"
              onClick={() => setConfirmResetOpen(true)}
            >
              Reset Data
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        onConfirm={handleResetDefaults}
        title="Reset All Data?"
        message="This will clear your local database and restore demo workspaces and tasks. Any custom data will be lost."
        confirmLabel="Reset to Demo State"
      />
    </>
  );
}
