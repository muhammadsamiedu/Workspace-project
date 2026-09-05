-- ========================================================
-- WORKSPACE MANAGER - RELATIONAL DATABASE SCHEMA
-- Compatible with PostgreSQL, MySQL, Supabase, Neon & SQLite
-- Architecture: User -> Workspaces -> Projects -> Tasks -> Subtasks
-- ========================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL DEFAULT '',
    avatar_url TEXT,
    bio TEXT,
    initials VARCHAR(8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. WORKSPACES TABLE (Each user can create & own multiple workspaces)
CREATE TABLE IF NOT EXISTS workspaces (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    category VARCHAR(128) DEFAULT 'Software Engineering',
    description TEXT,
    icon VARCHAR(64) DEFAULT 'zap',
    color VARCHAR(32) DEFAULT '#6366f1',
    default_view VARCHAR(32) DEFAULT 'kanban',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_workspace_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. WORKSPACE MEMBERS TABLE (Team members in each workspace)
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    role VARCHAR(32) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (workspace_id, user_id),
    CONSTRAINT fk_member_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_member_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. PROJECTS TABLE (Each workspace contains multiple projects/streams)
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(64) DEFAULT 'folder',
    color VARCHAR(32) DEFAULT '#6366f1',
    status VARCHAR(32) DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    default_view VARCHAR(32) DEFAULT 'kanban',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- 5. TASKS TABLE (Each project contains multiple tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(32) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority VARCHAR(32) DEFAULT 'medium' CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
    due_date TIMESTAMP WITH TIME ZONE NULL,
    assignee_id VARCHAR(64) NULL,
    tags JSON DEFAULT '[]',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_task_assignee FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 6. SUBTASKS TABLE (Each task is divided into actionable subtasks)
CREATE TABLE IF NOT EXISTS subtasks (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL,
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subtask_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(64) PRIMARY KEY,
    task_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT fk_comment_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    workspace_id VARCHAR(64) NOT NULL,
    project_id VARCHAR(64) NULL,
    task_id VARCHAR(64) NULL,
    task_title VARCHAR(500) NULL,
    user_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- ========================================================
-- INDEXES FOR MAXIMUM QUERY SPEED & PERFORMANCE
-- ========================================================
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);

-- ========================================================
-- SAMPLE SEED DATA DEMONSTRATING MULTI-WORKSPACE SETUP
-- ========================================================

-- Insert Demo Users
INSERT INTO users (id, name, email, avatar_url, bio, initials)
VALUES 
('user-1', 'Alex Rivera', 'alex.rivera@workspace.io', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', 'Lead Engineer', 'AR'),
('user-2', 'Sarah Chen', 'sarah.chen@workspace.io', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Senior Product Manager', 'SC')
ON CONFLICT (id) DO NOTHING;

-- Insert Multiple Workspaces for Alex Rivera
INSERT INTO workspaces (id, owner_id, name, slug, category, description, icon, color, default_view)
VALUES 
('ws-1', 'user-1', 'Acme Corp Platform', 'acme-corp-platform', 'Enterprise Software', 'Primary corporate platform engineering workspace.', 'layers', '#6366f1', 'kanban'),
('ws-2', 'user-1', 'Saylani Innovation Hub', 'saylani-innovation-hub', 'Education & Tech', 'Saylani advanced AI & web engineering workspace.', 'zap', '#10b981', 'hierarchy'),
('ws-3', 'user-1', 'Mobile App Ventures', 'mobile-app-ventures', 'Mobile Engineering', 'React Native & iOS cross-platform launch workspace.', 'rocket', '#ec4899', 'kanban')
ON CONFLICT (id) DO NOTHING;

-- Insert Projects in Workspaces
INSERT INTO projects (id, workspace_id, name, description, icon, color, status, default_view)
VALUES 
-- Projects in Workspace 1
('proj-101', 'ws-1', 'Core Web App', 'Next.js web application and dashboard services.', 'layout', '#6366f1', 'active', 'kanban'),
('proj-102', 'ws-1', 'Cloud Infrastructure', 'Kubernetes cluster, microservices, and CI/CD pipelines.', 'server', '#3b82f6', 'active', 'kanban'),
-- Projects in Workspace 2
('proj-201', 'ws-2', 'Student LMS Platform', 'Learning management system and interactive code playground.', 'book-open', '#10b981', 'active', 'hierarchy'),
('proj-202', 'ws-2', 'AI Chatbot Assistant', 'Intelligent pairing agent with voice and code generation.', 'cpu', '#8b5cf6', 'active', 'kanban'),
-- Projects in Workspace 3
('proj-301', 'ws-3', 'iOS & Android App', 'Customer-facing mobile application with biometric login.', 'smartphone', '#ec4899', 'active', 'kanban')
ON CONFLICT (id) DO NOTHING;

-- Insert Tasks in Projects
INSERT INTO tasks (id, workspace_id, project_id, title, description, status, priority, assignee_id, sort_order)
VALUES 
('task-1', 'ws-1', 'proj-101', 'Setup Multi-Workspace Store & Slices', 'Configure Redux persistence with multi-workspace support.', 'done', 'urgent', 'user-1', 0),
('task-2', 'ws-1', 'proj-101', 'Interactive General Analytics Dashboard', 'Build master dashboard with charts for all workspaces.', 'in_progress', 'high', 'user-1', 1),
('task-3', 'ws-2', 'proj-201', 'Student Enrollment & Course Hierarchy', 'Create courses divided into modules, lessons, and assignments.', 'todo', 'high', 'user-2', 0),
('task-4', 'ws-3', 'proj-301', 'Push Notification FCM Integration', 'Setup background notification worker and permissions.', 'todo', 'medium', 'user-1', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert Subtasks for Tasks
INSERT INTO subtasks (id, task_id, title, completed)
VALUES 
('sub-1', 'task-1', 'Configure Redux workspaceSlice', true),
('sub-2', 'task-1', 'Add localStorage rehydration listener', true),
('sub-3', 'task-2', 'Design workspace workload bar graph', true),
('sub-4', 'task-2', 'Build task status velocity donut chart', false),
('sub-5', 'task-2', 'Add 1-click workspace switch cards', false),
('sub-6', 'task-3', 'Design database schema for course modules', false),
('sub-7', 'task-4', 'Configure Google Firebase Cloud Messaging credentials', false)
ON CONFLICT (id) DO NOTHING;
