'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { closeModal, showToast } from '@/redux/slices/uiSlice';
import { createWorkspace } from '@/redux/slices/workspaceSlice';
import { addMultipleProjects } from '@/redux/slices/projectSlice';
import { addMultipleTasks } from '@/redux/slices/taskSlice';
import { setView } from '@/redux/slices/viewSlice';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconRenderer, AVAILABLE_SVG_ICONS } from '@/components/ui/icon-renderer';
import {
  Workspace,
  Project,
  Task,
  Subtask,
  TaskPriority,
  TaskStatus,
} from '@/lib/types';
import { generateId, cn, PRIORITY_CONFIG } from '@/lib/utils';
import {
  Building2,
  FolderKanban,
  CheckSquare,
  ListTree,
  Rocket,
  Plus,
  Trash2,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Layers,
  Code2,
  Megaphone,
  Palette,
  Briefcase,
  Workflow,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

interface WizardProject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface WizardTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  subtasks: { id: string; title: string; completed: boolean }[];
}

const TEMPLATES = [
  {
    id: 'fullstack',
    name: 'Full-Stack Software Development',
    category: 'Engineering',
    icon: 'code',
    color: '#6366f1',
    description: 'Structure for frontend, backend API microservices, and QA testing workflow.',
    projects: [
      {
        name: 'Web Platform Frontend',
        description: 'Next.js 16 app, React 19 UI components & user flows',
        icon: 'layout',
        color: '#6366f1',
        tasks: [
          {
            title: 'Authentication & Session Flow',
            priority: 'urgent' as TaskPriority,
            status: 'in_progress' as TaskStatus,
            subtasks: [
              'Build responsive sign-in and registration forms',
              'Implement secure JWT token persistence',
              'Create protected route middleware',
              'Add role-based UI conditional rendering',
            ],
          },
          {
            title: 'Interactive Dashboard Architecture',
            priority: 'high' as TaskPriority,
            status: 'todo' as TaskStatus,
            subtasks: [
              'Configure Redux Toolkit state slices',
              'Design modular workspace navigation sidebar',
              'Implement multi-view switcher (Kanban, List, Hierarchy)',
            ],
          },
        ],
      },
      {
        name: 'Core Backend & APIs',
        description: 'RESTful API routes, database schema, and services',
        icon: 'terminal',
        color: '#10b981',
        tasks: [
          {
            title: 'Database Schema & Migrations',
            priority: 'high' as TaskPriority,
            status: 'todo' as TaskStatus,
            subtasks: [
              'Define Workspace, Project, Task relational schema',
              'Write database migration scripts',
              'Seed initial test dataset',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'product_launch',
    name: 'Product Launch & Marketing Campaign',
    category: 'Marketing',
    icon: 'rocket',
    color: '#ec4899',
    description: 'Divided into Brand Assets, Go-To-Market strategy, and Social Outreach.',
    projects: [
      {
        name: 'Brand & Launch Assets',
        description: 'High-converting landing pages, graphics, and video demos',
        icon: 'palette',
        color: '#ec4899',
        tasks: [
          {
            title: 'Hero Landing Page Redesign',
            priority: 'urgent' as TaskPriority,
            status: 'todo' as TaskStatus,
            subtasks: [
              'Draft copy and value proposition headline',
              'Create interactive product preview mockups',
              'Conduct A/B testing on call-to-action buttons',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'custom_blank',
    name: 'Custom Clean Workspace',
    category: 'General',
    icon: 'layers',
    color: '#8b5cf6',
    description: 'Start from scratch and custom define your own projects, tasks, and subtasks.',
    projects: [
      {
        name: 'Main Stream 1',
        description: 'Primary project stream',
        icon: 'folder',
        color: '#8b5cf6',
        tasks: [
          {
            title: 'Initial Core Milestone',
            priority: 'high' as TaskPriority,
            status: 'todo' as TaskStatus,
            subtasks: [
              'Research project requirements & scope',
              'Divide into initial deliverables',
              'Assign responsibility to team members',
            ],
          },
        ],
      },
    ],
  },
];

const COLOR_OPTIONS = [
  '#6366f1', // Indigo
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#8b5cf6', // Violet
];

export function WorkspaceWizardModal() {
  const dispatch = useAppDispatch();
  const activeModal = useAppSelector((state) => state.ui.activeModal);
  const currentUser = useAppSelector((state) => state.auth.currentUser);

  const isOpen = activeModal === 'workspace_wizard';

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 1: Workspace basics
  const [name, setName] = useState('Saylani Tech Hub');
  const [slug, setSlug] = useState('saylani-tech-hub');
  const [category, setCategory] = useState('Software Engineering');
  const [description, setDescription] = useState(
    'Centralized engineering workspace divided into specialized projects, tasks, and actionable subtasks.'
  );
  const [icon, setIcon] = useState('zap');
  const [color, setColor] = useState('#6366f1');

  // Step 2: Projects
  const [projects, setProjects] = useState<WizardProject[]>([
    {
      id: 'wp-1',
      name: 'Frontend Web Application',
      description: 'Next.js 16 app UI, components, and user dashboard',
      icon: 'layout',
      color: '#6366f1',
    },
    {
      id: 'wp-2',
      name: 'Backend API & Database',
      description: 'API services, authentication, and data architecture',
      icon: 'terminal',
      color: '#10b981',
    },
  ]);

  // Step 3: Tasks
  const [tasks, setTasks] = useState<WizardTask[]>([
    {
      id: 'wt-1',
      projectId: 'wp-1',
      title: 'Setup Redux State & Hydration',
      description: 'Configure store, persistence, and typed hooks',
      priority: 'urgent',
      status: 'in_progress',
      subtasks: [
        { id: 'ws-1', title: 'Define root state and dispatch hooks', completed: true },
        { id: 'ws-2', title: 'Implement slices for workspaces, projects & tasks', completed: true },
        { id: 'ws-3', title: 'Add localStorage rehydration with fallback', completed: false },
      ],
    },
    {
      id: 'wt-2',
      projectId: 'wp-1',
      title: 'Design Responsive Workspace UI',
      description: 'Build sidebar navigation, top bar, and theme switcher',
      priority: 'high',
      status: 'todo',
      subtasks: [
        { id: 'ws-4', title: 'Create collapsible sidebar with workspace switcher', completed: true },
        { id: 'ws-5', title: 'Build topbar with breadcrumbs and view buttons', completed: false },
        { id: 'ws-6', title: 'Implement dark and light mode styling tokens', completed: false },
      ],
    },
    {
      id: 'wt-3',
      projectId: 'wp-2',
      title: 'Authentication & Role Permissions',
      description: 'Owner, Admin, Member, and Viewer role guard validation',
      priority: 'urgent',
      status: 'todo',
      subtasks: [
        { id: 'ws-7', title: 'Implement JWT user session handler', completed: false },
        { id: 'ws-8', title: 'Create usePermissions RBAC hook', completed: false },
        { id: 'ws-9', title: 'Setup read-only viewer mode banners', completed: false },
      ],
    },
  ]);

  // Helper inputs for adding items in each step
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium');

  const [activeTaskForSubtasks, setActiveTaskForSubtasks] = useState<string>('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen) return null;

  // Apply template
  const applyTemplate = (t: (typeof TEMPLATES)[0]) => {
    setName(t.name);
    setSlug(t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    setCategory(t.category);
    setIcon(t.icon);
    setColor(t.color);
    setDescription(t.description);

    const generatedProjects: WizardProject[] = [];
    const generatedTasks: WizardTask[] = [];

    t.projects.forEach((proj, pIdx) => {
      const pId = `wp-gen-${pIdx + 1}`;
      generatedProjects.push({
        id: pId,
        name: proj.name,
        description: proj.description,
        icon: proj.icon,
        color: proj.color,
      });

      proj.tasks.forEach((tsk, tIdx) => {
        const tId = `wt-gen-${pIdx + 1}-${tIdx + 1}`;
        generatedTasks.push({
          id: tId,
          projectId: pId,
          title: tsk.title,
          description: '',
          priority: tsk.priority,
          status: tsk.status,
          subtasks: tsk.subtasks.map((subTitle, sIdx) => ({
            id: `ws-gen-${tId}-${sIdx + 1}`,
            title: subTitle,
            completed: false,
          })),
        });
      });
    });

    setProjects(generatedProjects);
    setTasks(generatedTasks);
    if (generatedTasks[0]) {
      setActiveTaskForSubtasks(generatedTasks[0].id);
    }
  };

  // Add a project
  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: WizardProject = {
      id: generateId('wp'),
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom project stream',
      icon: 'folder',
      color: COLOR_OPTIONS[projects.length % COLOR_OPTIONS.length],
    };
    setProjects([...projects, newProj]);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handleRemoveProject = (id: string) => {
    if (projects.length <= 1) {
      dispatch(showToast({ id: generateId('t'), message: 'A workspace needs at least 1 project division', type: 'warning' }));
      return;
    }
    setProjects(projects.filter((p) => p.id !== id));
    setTasks(tasks.filter((t) => t.projectId !== id));
  };

  // Add a task
  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const targetProjId = newTaskProjectId || projects[0]?.id;
    if (!targetProjId) return;

    const newTask: WizardTask = {
      id: generateId('wt'),
      projectId: targetProjId,
      title: newTaskTitle.trim(),
      description: '',
      priority: newTaskPriority,
      status: 'todo',
      subtasks: [
        { id: generateId('sub'), title: '1. Plan requirements & scope', completed: false },
        { id: generateId('sub'), title: '2. Implement deliverable', completed: false },
      ],
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setActiveTaskForSubtasks(newTask.id);
  };

  const handleRemoveTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    if (activeTaskForSubtasks === id) {
      const remaining = tasks.filter((t) => t.id !== id);
      setActiveTaskForSubtasks(remaining[0]?.id || '');
    }
  };

  // Add a subtask to selected task
  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: [
            ...t.subtasks,
            { id: generateId('sub'), title: newSubtaskTitle.trim(), completed: false },
          ],
        };
      })
    );
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (taskId: string, subId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.filter((s) => s.id !== subId),
        };
      })
    );
  };

  const handleToggleSubtask = (taskId: string, subId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, completed: !s.completed } : s)),
        };
      })
    );
  };

  // Smart presets for subtasks
  const applySubtaskPreset = (taskId: string, presetType: 'dev' | 'qa' | 'design') => {
    const presets = {
      dev: ['Architecture setup & dependencies', 'Core feature implementation', 'Unit tests & code review', 'Documentation update'],
      qa: ['Smoke test happy path', 'Edge cases & boundary check', 'Mobile responsiveness audit', 'Bug fixes verification'],
      design: ['Wireframe & layout exploration', 'High fidelity visual design', 'Component states (hover, focus, disabled)', 'Handoff to engineering'],
    };

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newItems = presets[presetType].map((title) => ({
          id: generateId('sub'),
          title,
          completed: false,
        }));
        return {
          ...t,
          subtasks: [...t.subtasks, ...newItems],
        };
      })
    );
  };

  // Final Deploy: Create workspace, projects, tasks with subtasks
  const handleDeploy = () => {
    if (!name.trim()) {
      dispatch(showToast({ id: generateId('t'), message: 'Please enter a workspace name', type: 'error' }));
      setStep(1);
      return;
    }

    const workspaceId = generateId('ws');
    const createdDate = new Date().toISOString();

    // 1. Create Workspace
    const newWs: Workspace = {
      id: workspaceId,
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category,
      description,
      icon,
      color,
      defaultView: 'hierarchy',
      members: [
        {
          userId: currentUser.id,
          role: 'owner',
          joinedAt: createdDate,
        },
      ],
      createdAt: createdDate,
    };

    // 2. Create Projects
    const projectMap: Record<string, string> = {};
    const createdProjects: Project[] = projects.map((p) => {
      const realId = generateId('proj');
      projectMap[p.id] = realId;
      return {
        id: realId,
        workspaceId,
        name: p.name,
        description: p.description,
        icon: p.icon || 'folder',
        color: p.color || color,
        status: 'active',
        memberIds: [currentUser.id],
        columns: [
          { id: 'todo', title: 'To Do', color: '#64748b' },
          { id: 'in_progress', title: 'In Progress', color: '#3b82f6' },
          { id: 'review', title: 'Review', color: '#f59e0b' },
          { id: 'done', title: 'Done', color: '#10b981' },
        ],
        defaultView: 'hierarchy',
        createdAt: createdDate,
        updatedAt: createdDate,
      };
    });

    // 3. Create Tasks with Subtasks
    const createdTasks: Task[] = tasks.map((t, idx) => {
      const mappedProjId = projectMap[t.projectId] || createdProjects[0].id;
      const taskId = generateId('task');
      return {
        id: taskId,
        workspaceId,
        projectId: mappedProjId,
        title: t.title,
        description: t.description || `Task defined during workspace design for ${name}.`,
        status: t.status,
        priority: t.priority,
        dueDate: null,
        assigneeId: currentUser.id,
        tags: [category.split(' ')[0] || 'Core'],
        subtasks: t.subtasks.map((s) => ({
          id: generateId('sub'),
          taskId,
          title: s.title,
          completed: s.completed,
        })),
        attachments: [],
        order: idx,
        createdAt: createdDate,
        updatedAt: createdDate,
      };
    });

    // Dispatch to Redux Store
    dispatch(createWorkspace(newWs));
    dispatch(addMultipleProjects({ projects: createdProjects, activeId: createdProjects[0]?.id }));
    dispatch(addMultipleTasks(createdTasks));
    dispatch(setView('hierarchy'));

    dispatch(
      showToast({
        id: generateId('toast'),
        message: `🎉 Workspace "${newWs.name}" created with ${createdProjects.length} projects, ${createdTasks.length} tasks, and ${createdTasks.reduce((acc, t) => acc + t.subtasks.length, 0)} subtasks!`,
        type: 'success',
        duration: 5000,
      })
    );

    dispatch(closeModal());
  };

  const currentSelectedTask = tasks.find((t) => t.id === activeTaskForSubtasks) || tasks[0];

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => dispatch(closeModal())}
      title=""
      size="xl"
    >
      <div className="flex flex-col h-[680px] -mt-4 select-none">
        {/* Wizard Header & Stepper */}
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                  Workspace Architecture Studio
                </span>
                <span className="text-xs text-zinc-400">Step {step} of 5</span>
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {step === 1 && '1. Design Workspace Identity & Brand'}
                {step === 2 && '2. Divide Workspace into Projects & Streams'}
                {step === 3 && '3. Divide Projects into Core Tasks'}
                {step === 4 && '4. Divide Tasks into Actionable Subtasks'}
                {step === 5 && '5. Review Blueprint & Launch Workspace'}
              </h2>
            </div>

            {/* Step badges */}
            <div className="hidden sm:flex items-center gap-1.5">
              {[
                { num: 1, label: 'Workspace' },
                { num: 2, label: 'Projects' },
                { num: 3, label: 'Tasks' },
                { num: 4, label: 'Subtasks' },
                { num: 5, label: 'Review' },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setStep(s.num as any)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                    step === s.num
                      ? 'bg-indigo-600 text-white font-semibold'
                      : step > s.num
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  )}
                >
                  {step > s.num ? <CheckCircle2 className="w-3 h-3" /> : <span>{s.num}</span>}
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto px-1 pr-2">
          {/* STEP 1: WORKSPACE IDENTITY */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Quick Starter Templates */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Choose a Pre-Engineered Blueprint or Start Custom:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {TEMPLATES.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => applyTemplate(tpl)}
                      className={cn(
                        'p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left relative hover:border-indigo-400 dark:hover:border-indigo-500',
                        name === tpl.name
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/30 shadow-xs'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: tpl.color }}
                        >
                          <IconRenderer icon={tpl.icon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                          {tpl.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2">{tpl.description}</p>
                      <Badge variant="neutral" size="sm">
                        {tpl.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Workspace Name *
                  </label>
                  <Input
                    placeholder="e.g. Saylani Tech Innovation"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    URL Identifier / Slug
                  </label>
                  <Input
                    placeholder="e.g. saylani-tech-hub"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Domain / Category
                  </label>
                  <Input
                    placeholder="e.g. Software Engineering, Marketing, Design"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    Brand Color & Visual Icon
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_OPTIONS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setColor(c)}
                          className={cn(
                            'w-6 h-6 rounded-full transition-transform cursor-pointer',
                            color === c && 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    {/* Icon Selection */}
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                      {['zap', 'rocket', 'code', 'layers', 'palette'].map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setIcon(ic)}
                          className={cn(
                            'p-1.5 rounded-md transition-colors cursor-pointer',
                            icon === ic ? 'bg-white dark:bg-zinc-700 shadow-xs' : 'text-zinc-500'
                          )}
                        >
                          <IconRenderer icon={ic} className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Workspace Purpose & Description
                </label>
                <Textarea
                  placeholder="Describe the main objectives and team scope of this workspace..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Workspace Preview Badge */}
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    <IconRenderer icon={icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {name || 'Untitled Workspace'}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      slug: {slug || 'workspace'} • category: {category}
                    </p>
                  </div>
                </div>
                <Badge variant="indigo" size="sm">
                  Active Blueprint
                </Badge>
              </div>
            </div>
          )}

          {/* STEP 2: DIVIDE INTO PROJECTS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-3 flex items-start gap-2.5">
                <FolderKanban className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Step 2: Divide "{name}" into Projects & Divisions
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    A workspace contains distinct project streams (e.g. Frontend, Backend, Design, Sprints). Each project will contain its own tasks and subtasks.
                  </p>
                </div>
              </div>

              {/* List of current projects */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Workspace Divisions / Projects ({projects.length}):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projects.map((proj, idx) => (
                    <div
                      key={proj.id}
                      className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5"
                          style={{ backgroundColor: proj.color }}
                        >
                          <IconRenderer icon={proj.icon} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                            {proj.name}
                          </h4>
                          <p className="text-[11px] text-zinc-500 line-clamp-1">{proj.description}</p>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                            {tasks.filter((t) => t.projectId === proj.id).length} tasks planned
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveProject(proj.id)}
                        className="p-1 rounded-md text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Remove project division"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Project Form */}
              <div className="p-3.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                  Add Another Project Division
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Project Name (e.g. Mobile App, Quality Assurance)"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProject())}
                  />
                  <Input
                    placeholder="Description or focus area"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProject())}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddProject}
                  disabled={!newProjectName.trim()}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Project Division
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DIVIDE INTO TASKS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-3 flex items-start gap-2.5">
                <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Step 3: Divide Projects into Core Tasks
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Define the essential deliverables under each project division. In Step 4, we will divide each of these tasks into subtasks!
                  </p>
                </div>
              </div>

              {/* Current Tasks Grouped by Project */}
              <div className="space-y-3">
                {projects.map((proj) => {
                  const projTasks = tasks.filter((t) => t.projectId === proj.id);
                  return (
                    <div
                      key={proj.id}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-white dark:bg-zinc-900/40 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px]"
                            style={{ backgroundColor: proj.color }}
                          >
                            <IconRenderer icon={proj.icon} className="w-3 h-3" />
                          </div>
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {proj.name} ({projTasks.length} tasks)
                          </h4>
                        </div>
                      </div>

                      {projTasks.length === 0 ? (
                        <p className="text-xs text-zinc-400 italic py-1">No tasks in this division yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {projTasks.map((tsk) => {
                            const prio = PRIORITY_CONFIG[tsk.priority] || PRIORITY_CONFIG.medium;
                            return (
                              <div
                                key={tsk.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/60"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: prio.color }} />
                                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                    {tsk.title}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 shrink-0">
                                    ({tsk.subtasks.length} subtasks)
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      tsk.priority === 'urgent'
                                        ? 'rose'
                                        : tsk.priority === 'high'
                                        ? 'amber'
                                        : tsk.priority === 'low'
                                        ? 'neutral'
                                        : 'indigo'
                                    }
                                    size="sm"
                                  >
                                    {prio.label}
                                  </Badge>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTask(tsk.id)}
                                    className="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add Task Input Form */}
              <div className="p-3.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3">
                <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />
                  Add a New Task
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Task Title (e.g. Implement Payment Gateway, Redesign Navbar)"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      className="flex-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-1.5"
                      value={newTaskProjectId || projects[0]?.id}
                      onChange={(e) => setNewTaskProjectId(e.target.value)}
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    <select
                      className="text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 px-2 py-1.5"
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim()}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: DIVIDE TASKS INTO SUBTASKS */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 rounded-xl p-3 flex items-start gap-2.5">
                <ListTree className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    Step 4: Divide Each Task into Actionable Subtasks
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Break down complex tasks into atomic checklist subtasks. Select a task on the left and edit or generate its subtasks on the right.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[380px]">
                {/* Left column: Tasks list */}
                <div className="md:col-span-5 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 overflow-y-auto space-y-1.5 bg-zinc-50/40 dark:bg-zinc-900/40">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-1">
                    Select Task to Break Down:
                  </span>
                  {tasks.map((tsk) => {
                    const isSelected = (activeTaskForSubtasks || tasks[0]?.id) === tsk.id;
                    const proj = projects.find((p) => p.id === tsk.projectId);
                    return (
                      <button
                        key={tsk.id}
                        type="button"
                        onClick={() => setActiveTaskForSubtasks(tsk.id)}
                        className={cn(
                          'w-full text-left p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2',
                          isSelected
                            ? 'border-indigo-500 bg-white dark:bg-zinc-800 shadow-xs'
                            : 'border-transparent hover:bg-white/60 dark:hover:bg-zinc-800/60'
                        )}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                            {tsk.title}
                          </p>
                          <span className="text-[10px] text-zinc-400">
                            {proj?.name || 'Project'} • {tsk.subtasks.length} subtasks
                          </span>
                        </div>
                        <ChevronRight className={cn('w-4 h-4 text-zinc-400', isSelected && 'text-indigo-500')} />
                      </button>
                    );
                  })}
                </div>

                {/* Right column: Subtasks for selected task */}
                <div className="md:col-span-7 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col justify-between bg-white dark:bg-zinc-900/60">
                  {currentSelectedTask ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                            Dividing Task into Subtasks
                          </span>
                          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {currentSelectedTask.title}
                          </h4>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => applySubtaskPreset(currentSelectedTask.id, 'dev')}
                            className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
                          >
                            + Dev Preset
                          </button>
                          <button
                            type="button"
                            onClick={() => applySubtaskPreset(currentSelectedTask.id, 'qa')}
                            className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                          >
                            + QA Preset
                          </button>
                        </div>
                      </div>

                      {/* Subtask list */}
                      <div className="flex-1 overflow-y-auto py-2 space-y-1.5 min-h-0">
                        {currentSelectedTask.subtasks.length === 0 ? (
                          <div className="text-center py-6 text-zinc-400 text-xs">
                            No subtasks yet. Add one below or use a quick preset above.
                          </div>
                        ) : (
                          currentSelectedTask.subtasks.map((sub, idx) => (
                            <div
                              key={sub.id}
                              className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/40"
                            >
                              <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => handleToggleSubtask(currentSelectedTask.id, sub.id)}
                                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                                />
                                <span
                                  className={cn(
                                    'text-xs text-zinc-800 dark:text-zinc-200 truncate',
                                    sub.completed && 'line-through text-zinc-400'
                                  )}
                                >
                                  {sub.title}
                                </span>
                              </label>

                              <button
                                type="button"
                                onClick={() => handleRemoveSubtask(currentSelectedTask.id, sub.id)}
                                className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add subtask input */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
                        <Input
                          placeholder="Type subtask step (press Enter)..."
                          value={newSubtaskTitle}
                          onChange={(e) => setNewSubtaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSubtask(currentSelectedTask.id);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddSubtask(currentSelectedTask.id)}
                          disabled={!newSubtaskTitle.trim()}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400 text-xs">
                      Select a task on the left to divide it into subtasks.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: VISUAL BLUEPRINT & LAUNCH */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl p-3 flex items-start gap-2.5">
                <Rocket className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Step 5: Review Complete Workspace Architecture Blueprint
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Verify the full hierarchical decomposition before deployment: <strong>Workspace → Projects → Tasks → Subtasks</strong>.
                  </p>
                </div>
              </div>

              {/* Hierarchy Tree Card */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/50 space-y-4 max-h-[380px] overflow-y-auto">
                {/* Workspace Root */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xs">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: color }}
                  >
                    <IconRenderer icon={icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>{name}</span>
                      <Badge variant="indigo" size="sm">
                        WORKSPACE ROOT
                      </Badge>
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      {projects.length} Project Streams • {tasks.length} Core Tasks •{' '}
                      {tasks.reduce((a, b) => a + b.subtasks.length, 0)} Total Subtasks
                    </p>
                  </div>
                </div>

                {/* Projects & Tasks Tree */}
                <div className="pl-4 space-y-4 border-l-2 border-indigo-200 dark:border-indigo-900 ml-4">
                  {projects.map((proj) => {
                    const projTasks = tasks.filter((t) => t.projectId === proj.id);
                    return (
                      <div key={proj.id} className="space-y-2">
                        {/* Project Header */}
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          <FolderKanban className="w-4 h-4" style={{ color: proj.color }} />
                          <span>PROJECT: {proj.name}</span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            ({projTasks.length} tasks)
                          </span>
                        </div>

                        {/* Project Tasks */}
                        <div className="pl-4 space-y-2 border-l border-zinc-200 dark:border-zinc-800 ml-2">
                          {projTasks.map((tsk) => (
                            <div
                              key={tsk.id}
                              className="p-2.5 rounded-lg bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 shadow-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                    {tsk.title}
                                  </span>
                                </div>
                                <Badge
                                  variant={
                                    tsk.priority === 'urgent'
                                      ? 'rose'
                                      : tsk.priority === 'high'
                                      ? 'amber'
                                      : 'default'
                                  }
                                  size="sm"
                                >
                                  {tsk.priority}
                                </Badge>
                              </div>

                              {/* Nested Subtasks */}
                              <div className="pl-5 space-y-1">
                                {tsk.subtasks.map((sub) => (
                                  <div
                                    key={sub.id}
                                    className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400"
                                  >
                                    <span className="text-indigo-500 font-mono text-[10px]">↳</span>
                                    <span className={sub.completed ? 'line-through text-zinc-400' : ''}>
                                      ☑ {sub.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-3 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep((step - 1) as any)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => dispatch(closeModal())}
              >
                Cancel
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 5 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setStep((step + 1) as any)}
              >
                Continue to Step {step + 1} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeploy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-900/30"
              >
                <Rocket className="w-4 h-4 mr-1.5" /> Deploy & Open Workspace
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
