'use client';

import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux';
import { loginAs, login, signup } from '@/redux/slices/authSlice';
import { openModal } from '@/redux/slices/uiSlice';
import { Role, User } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Layers,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Zap,
  Users,
  BarChart3,
  Shield,
  AlertCircle,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Workspace Architecture Studio',
    desc: 'Design full workspace identity, then divide into projects, tasks & actionable subtasks.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    icon: Zap,
    title: 'Hierarchy & Breakdown View',
    desc: 'Visual tree from Workspace to subtasks with inline checklists and progress meters.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart3,
    title: 'Kanban, List & Calendar Views',
    desc: 'Multiple visual modes with drag-and-drop, multi-filters, and instant switching.',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Shield,
    title: 'Role-Based Permissions',
    desc: 'Owner, Admin, Member, and Viewer — each with granular control and audit logs.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
];

export function LoginPage() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.auth.users);

  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('member');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [buildWorkspaceAfterLogin, setBuildWorkspaceAfterLogin] = useState(true);

  const DEMO_CREDENTIALS: Record<string, string> = {
    'alex.rivera@workspace.io': 'demo1234',
    'sarah.chen@workspace.io': 'demo1234',
    'marcus.brody@workspace.io': 'demo1234',
    'elena.rostova@workspace.io': 'demo1234',
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((r) => setTimeout(r, 700));

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!matchedUser) {
      setError('No account found with this email address.');
      setIsLoading(false);
      return;
    }

    const expectedPassword = DEMO_CREDENTIALS[matchedUser.email] || 'demo1234';
    if (password !== expectedPassword && password !== 'demo1234') {
      setError('Incorrect password. Use "demo1234" for all accounts.');
      setIsLoading(false);
      return;
    }

    dispatch(login(matchedUser.id));
    if (buildWorkspaceAfterLogin) {
      dispatch(openModal({ name: 'workspace_wizard' }));
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (matchedUser) {
      setError('An account with this email already exists. Please sign in instead.');
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const initials = name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      role,
      bio: `${role.toUpperCase()} team member`,
      initials: initials || 'WM',
    };

    dispatch(signup(newUser));
    // Immediately open Workspace Wizard for new signup to build their workspace
    dispatch(openModal({ name: 'workspace_wizard' }));
    setIsLoading(false);
  };

  const handleQuickLogin = async (userId: string, openWizard: boolean = false) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    dispatch(loginAs(userId));
    dispatch(login(userId));
    if (openWizard || buildWorkspaceAfterLogin) {
      dispatch(openModal({ name: 'workspace_wizard' }));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex bg-[var(--bg-app)] overflow-hidden">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Background gradient mesh */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[100px] translate-x-1/4 translate-y-1/4" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Grid lines overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Workspace Manager
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production-grade Task Management</span>
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Ship projects faster
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
                with total clarity.
              </span>
            </h1>
            <p className="text-slate-400 text-base max-w-xs leading-relaxed">
              Plan, track, and collaborate on every task — from sprint kick-off
              to production deployment.
            </p>
          </div>

          {/* Feature list */}
          <div className="grid grid-cols-1 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div
                key={title}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] backdrop-blur-sm hover:bg-white/[0.07] transition-colors"
              >
                <div className={cn('p-2 rounded-lg shrink-0', bg)}>
                  <Icon className={cn('w-4 h-4', color)} />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-slate-500 text-xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Frontend-only demo · No backend required · Data persists in IndexedDB</span>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Layers className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-[var(--text-primary)] font-bold text-base">
            Workspace Manager
          </span>
        </div>

        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {authMode === 'signin' ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {authMode === 'signin'
                ? 'Sign in to your workspace to continue.'
                : 'Sign up to start organizing workspaces, tasks, and teams.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setError('');
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                authMode === 'signin'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setError('');
              }}
              className={cn(
                'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer',
                authMode === 'signup'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              Create Account
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {authMode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="alex.rivera@workspace.io"
                    required
                    className={cn(
                      'w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all',
                      error ? 'border-rose-500/60' : 'border-[var(--border-subtle)]'
                    )}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="••••••••"
                    required
                    className={cn(
                      'w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] border text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all',
                      error ? 'border-rose-500/60' : 'border-[var(--border-subtle)]'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Hint */}
              <p className="text-[11px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-lg px-3 py-2 border border-[var(--border-subtle)]">
                <span className="font-semibold text-[var(--text-secondary)]">Demo password:</span>{' '}
                <code className="font-mono text-indigo-500 font-bold">demo1234</code> — works for all demo accounts below.
              </p>

              {/* Workspace Builder Flow Checkbox */}
              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 cursor-pointer text-left select-none">
                <input
                  type="checkbox"
                  checked={buildWorkspaceAfterLogin}
                  onChange={(e) => setBuildWorkspaceAfterLogin(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-zinc-300 dark:border-zinc-700"
                />
                <div>
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Design & Build Workspace upon sign-in
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Recommended: Configure your workspace brand, then divide into projects, tasks & subtasks.
                  </p>
                </div>
              </label>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-900/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer',
                  isLoading && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Authenticating…</span>
                  </>
                ) : (
                  <>
                    {buildWorkspaceAfterLogin ? (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-200" />
                        <span>Sign In & Build Workspace</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setError('');
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer"
                >
                  Don&apos;t have an account? Sign up
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up / Create Account Form */
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Full Name
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. Zain Malik"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="zain@workspace.io"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Create a password"
                    required
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-secondary)]">
                  Choose Workspace Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'owner', label: 'Owner', desc: 'Full workspace control' },
                      { id: 'admin', label: 'Admin', desc: 'Manage projects & tasks' },
                      { id: 'member', label: 'Member', desc: 'Create & edit tasks' },
                      { id: 'viewer', label: 'Viewer', desc: 'Read-only access' },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={cn(
                        'p-2 rounded-xl text-left border transition-all cursor-pointer',
                        role === r.id
                          ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/40'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-indigo-500/40'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[var(--text-primary)] capitalize">
                          {r.label}
                        </span>
                        {role === r.id && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-900/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer',
                  isLoading && 'opacity-70 cursor-not-allowed'
                )}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Creating account…</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setError('');
                  }}
                  className="text-xs text-indigo-500 hover:text-indigo-400 font-medium cursor-pointer"
                >
                  Already have an account? Sign in
                </button>
              </div>
            </form>
          )}

          {/* Quick Login Section (Shown in sign in mode) */}
          {authMode === 'signin' && (
            <>
              {/* Divider */}
              <div className="relative flex items-center gap-4">
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                <span className="text-[11px] font-medium text-[var(--text-muted)] shrink-0">
                  or sign in as a demo user
                </span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>

              {/* Quick Login Cards */}
              <div className="grid grid-cols-2 gap-3">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user.id)}
                    onMouseEnter={() => setHoveredUser(user.id)}
                    onMouseLeave={() => setHoveredUser(null)}
                    disabled={isLoading}
                    className={cn(
                      'relative flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer',
                      'bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] hover:shadow-md hover:border-indigo-500/40',
                      hoveredUser === user.id
                        ? 'border-indigo-500/40 shadow-md scale-[1.02]'
                        : 'border-[var(--border-subtle)]',
                      isLoading && 'opacity-60 cursor-not-allowed pointer-events-none'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Avatar name={user.name} src={user.avatar} size="sm" showOnlineStatus />
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
                        {user.role}
                      </Badge>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">
                        {user.email}
                      </p>
                    </div>
                    {hoveredUser === user.id && (
                      <ArrowRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-[11px] text-[var(--text-muted)]">
            This is a frontend-only demo. All data is stored locally.
          </p>
        </div>
      </div>
    </div>
  );
}
