# 🚀 Workspace Manager — Modern Project & Task Management

A production-grade, ultra-responsive project and task management platform inspired by the fluidity of **Linear**, the organizational depth of **Notion**, and the agile execution of **Jira**.

Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Redux Toolkit**, and **Tailwind CSS v4**.

---

## 🌟 Key Features

### 🏢 1. Hierarchical Multi-Workspace System
- **Unlimited Workspace Organization:** Create and switch between multiple workspaces seamlessly.
- **Projects & Workflows:** Group tasks within dedicated projects with custom icons and colors.
- **Tasks & Subtasks:** Break down complex projects into actionable checklists with progress indicators.
- **Workspace Architecture Studio:** Interactive visual tree explorer for unlimited levels of workspaces, projects, and tasks.

### 📊 2. Dynamic Multi-View Workspace
Switch smoothly across multiple productivity views with clean path routing and native browser View Transitions:
- **📊 General Dashboard (`/dashboard`):** Real-time workspace analytics, task distribution charts, overdue counters, and workload breakdown.
- **🏢 Workspace Hub (`/workspaces`):** Complete organizational hierarchy tree and project management.
- **📋 Kanban Board (`/kanban`):** Agile drag-and-drop workflow (To Do, In Progress, Review, Done) with column WIP limits.
- **📝 Task List View (`/list`):** High-density tabular view with multi-column sorting (Priority, Due Date, Title) and status filters.
- **📅 Calendar View (`/calendar`):** Monthly timeline grid showing scheduled deadlines and overdue indicators.
- **🌀 Interactive Neural Vortex (`/demo`):** Procedurally generated WebGL GLSL shader background for immersive hero presentations.

### 🛡️ 3. Role-Based Access Control (RBAC)
- **Role Switching & Simulation:** Switch live between **Owner**, **Admin**, **Member**, and **Viewer**.
- **Viewer Protection:** Safe read-only view prevents unauthorized task creation, drag-and-drop, or project deletions.
- **Member Isolation:** Permissions automatically filter assigned tasks for team privacy.

### 💾 4. Local-First & Offline Resilience
- **Persistent Storage:** Instant IndexedDB and LocalStorage synchronization for lightning-fast loads.
- **Offline Mode:** Built-in connection detection with non-intrusive offline banners and background sync when reconnected.

### ⚡ 5. Power-User Workflow & UX
- **Command Palette (`Ctrl+K` / `Cmd+K`):** Jump to any workspace, project, or view, trigger actions, and switch themes instantly.
- **Keyboard Shortcuts (`?`):** Rapid keyboard navigation for switching views (`D`, `W`, `B`, `L`, `M`), creating tasks (`C`), and searching (`/`).
- **Dark / Light Theme:** Custom-tailored high-contrast dark mode and clean light theme with sleek glassmorphism.
- **Undo / Redo Support:** History stack to easily revert state changes.
- **Live Collaboration Simulation:** Built-in mock WebSocket live event simulator demonstrating real-time updates and activity notifications.

---

## 🛠️ Technology Stack

| Category | Technology |
| :--- | :--- |
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) with Turbopack |
| **UI Library** | [React 19](https://react.dev/) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Custom Glassmorphism CSS |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) & [React-Redux](https://react-redux.js.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Graphics** | HTML5 Canvas & Raw WebGL (Custom Vertex & Fragment Shaders) |
| **Storage** | IndexedDB & LocalStorage |

---

## 🧭 Application Routes

All routes feature clean, memorable URLs and instant transitions without page refreshes:

| Route | View | Description |
| :--- | :--- | :--- |
| `/dashboard` | **Overview** | General performance metrics, task stats, and project overviews |
| `/workspaces` | **Workspaces Hub** | Workspace hierarchy tree and project creation |
| `/kanban` | **Kanban Board** | Agile status boards with drag-and-drop task movement |
| `/list` | **List View** | High-density sortable and filterable task list |
| `/calendar` | **Calendar View** | Due date tracking on a monthly calendar grid |
| `/demo` | **Neural Vortex** | Interactive WebGL fluid particle shader demo |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.17 or higher (Node.js 20+ recommended)
- **npm** or **yarn** / **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/muhammadsamiedu/Workspace-project.git
   cd Workspace-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📦 Project Structure

```text
workspace-manager/
├── app/                              # Next.js 16 App Router pages
│   ├── calendar/page.tsx             # Calendar route (/calendar)
│   ├── dashboard/page.tsx            # Dashboard route (/dashboard)
│   ├── demo/page.tsx                 # Neural Vortex demo route (/demo)
│   ├── kanban/page.tsx               # Kanban route (/kanban)
│   ├── list/page.tsx                 # List route (/list)
│   ├── workspaces/page.tsx           # Workspaces route (/workspaces)
│   ├── globals.css                   # Tailwind CSS v4 & custom animations
│   ├── layout.tsx                    # Root layout with Redux StoreProvider
│   └── page.tsx                      # Default root page
├── components/
│   ├── features/                     # Feature-specific components
│   │   ├── auth/                     # Role switching, login & profiles
│   │   ├── collaboration/            # Activity feed & comments
│   │   ├── dashboard/                # General metrics dashboard
│   │   ├── filters/                  # Search, tags, priority & status filters
│   │   ├── layout/                   # Sidebar, Topbar, AppShell, Command Palette
│   │   ├── projects/                 # Project headers & modal forms
│   │   ├── tasks/                    # Task cards, modals, attachments & subtasks
│   │   ├── views/                    # Kanban board, List & Calendar views
│   │   └── workspaces/               # Workspace tree, settings & wizard
│   └── ui/                           # Reusable atomic design primitives (shadcn-compatible)
│       ├── button.tsx, modal.tsx, dropdown.tsx, avatar.tsx, badge.tsx...
│       └── interactive-neural-vortex-background.tsx # WebGL Shader canvas
├── hooks/                            # Custom hooks (Navigation, Shortcuts, Permissions, Redux)
├── lib/                              # Storage, types, utility helpers (cn) & seed data
├── redux/                            # Redux Toolkit store & feature slices
└── tsconfig.json                     # TypeScript configuration
```

---

## 🌐 Deployment on Vercel

The easiest way to deploy this Next.js app is using [Vercel](https://vercel.com):

1. Push your latest code to your GitHub repository.
2. Log in to [Vercel Dashboard](https://vercel.com).
3. Click **"Add New Project"** and select **`Workspace-project`**.
4. Leave the default build settings (`npm run build`, output `.next`).
5. Click **Deploy**.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

### 👨‍💻 Author
- **GitHub:** [@muhammadsamiedu](https://github.com/muhammadsamiedu)