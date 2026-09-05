import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Task, Subtask, Attachment, TaskStatus, TaskPriority } from '@/lib/types';
import { INITIAL_TASKS } from '@/lib/seedData';
import { getFromLocalStorage, saveToLocalStorage } from '@/lib/storage';
import { generateId } from '@/lib/utils';
import { RootState } from '../store';
import { pushHistory } from './historySlice';
import { logActivity } from './activitySlice';
import { showToast } from './uiSlice';

interface TaskState {
  tasks: Task[];
  selectedTaskIds: string[];
  activeTaskId: string | null;
  isSimulatingLatency: boolean;
  shouldSimulateError: boolean;
}

const savedTasks = getFromLocalStorage<Task[]>('tasks', INITIAL_TASKS);

const initialState: TaskState = {
  tasks: savedTasks,
  selectedTaskIds: [],
  activeTaskId: null,
  isSimulatingLatency: false,
  shouldSimulateError: false,
};

// Async thunk to demonstrate optimistic UI updates + rollback with artificial delay
export const optimisticMoveTask = createAsyncThunk(
  'tasks/optimisticMoveTask',
  async (
    payload: { taskId: string; newStatus: TaskStatus; newOrder?: number },
    { getState, dispatch, rejectWithValue }
  ) => {
    const state = getState() as RootState;
    const currentTask = state.tasks.tasks.find((t) => t.id === payload.taskId);
    if (!currentTask) return rejectWithValue('Task not found');

    const previousStatus = currentTask.status;
    const previousOrder = currentTask.order;

    // Optimistic mutation dispatched immediately
    dispatch(
      taskSlice.actions.moveTaskStatus({
        taskId: payload.taskId,
        newStatus: payload.newStatus,
        newOrder: payload.newOrder,
      })
    );

    // Artificial network latency simulation (400ms)
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Check if error simulation is enabled
    if (state.tasks.shouldSimulateError) {
      // Rollback to previous state
      dispatch(
        taskSlice.actions.moveTaskStatus({
          taskId: payload.taskId,
          newStatus: previousStatus,
          newOrder: previousOrder,
        })
      );
      dispatch(
        showToast({
          id: generateId('toast'),
          message: 'Network error simulated: Task movement rolled back!',
          type: 'error',
        })
      );
      return rejectWithValue('Simulated network failure');
    }

    return payload;
  }
);

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    setActiveTask: (state, action: PayloadAction<string | null>) => {
      state.activeTaskId = action.payload;
    },
    toggleSelectTask: (state, action: PayloadAction<string>) => {
      if (state.selectedTaskIds.includes(action.payload)) {
        state.selectedTaskIds = state.selectedTaskIds.filter((id) => id !== action.payload);
      } else {
        state.selectedTaskIds.push(action.payload);
      }
    },
    selectAllTasks: (state, action: PayloadAction<string[]>) => {
      state.selectedTaskIds = action.payload;
    },
    clearSelectedTasks: (state) => {
      state.selectedTaskIds = [];
    },
    setSimulateError: (state, action: PayloadAction<boolean>) => {
      state.shouldSimulateError = action.payload;
    },
    addTask: (state, action: PayloadAction<Task>) => {
      state.tasks.unshift(action.payload);
      saveToLocalStorage('tasks', state.tasks);
    },
    addMultipleTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks.unshift(...action.payload);
      saveToLocalStorage('tasks', state.tasks);
    },
    updateTask: (state, action: PayloadAction<Partial<Task> & { id: string }>) => {
      const idx = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (idx !== -1) {
        state.tasks[idx] = {
          ...state.tasks[idx],
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      state.selectedTaskIds = state.selectedTaskIds.filter((id) => id !== action.payload);
      if (state.activeTaskId === action.payload) {
        state.activeTaskId = null;
      }
      saveToLocalStorage('tasks', state.tasks);
    },
    moveTaskStatus: (
      state,
      action: PayloadAction<{ taskId: string; newStatus: TaskStatus; newOrder?: number }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.status = action.payload.newStatus;
        if (action.payload.newOrder !== undefined) {
          task.order = action.payload.newOrder;
        }
        task.updatedAt = new Date().toISOString();
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    reorderTasksInColumn: (
      state,
      action: PayloadAction<{ status: TaskStatus; orderedTaskIds: string[] }>
    ) => {
      action.payload.orderedTaskIds.forEach((taskId, index) => {
        const task = state.tasks.find((t) => t.id === taskId);
        if (task) {
          task.order = index;
        }
      });
      saveToLocalStorage('tasks', state.tasks);
    },
    addSubtask: (
      state,
      action: PayloadAction<{ taskId: string; subtask: Subtask }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.subtasks.push(action.payload.subtask);
        task.updatedAt = new Date().toISOString();
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    toggleSubtask: (
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        const sub = task.subtasks.find((s) => s.id === action.payload.subtaskId);
        if (sub) {
          sub.completed = !sub.completed;
          task.updatedAt = new Date().toISOString();
          saveToLocalStorage('tasks', state.tasks);
        }
      }
    },
    deleteSubtask: (
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.subtasks = task.subtasks.filter((s) => s.id !== action.payload.subtaskId);
        task.updatedAt = new Date().toISOString();
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    convertSubtaskToTask: (
      state,
      action: PayloadAction<{ taskId: string; subtaskId: string; newTaskId: string }>
    ) => {
      const parentTask = state.tasks.find((t) => t.id === action.payload.taskId);
      if (parentTask) {
        const subIndex = parentTask.subtasks.findIndex((s) => s.id === action.payload.subtaskId);
        if (subIndex !== -1) {
          const [sub] = parentTask.subtasks.splice(subIndex, 1);
          const newTask: Task = {
            id: action.payload.newTaskId,
            workspaceId: parentTask.workspaceId,
            projectId: parentTask.projectId,
            title: sub.title,
            description: `Converted from subtask of: **${parentTask.title}**`,
            status: parentTask.status,
            priority: parentTask.priority,
            dueDate: parentTask.dueDate,
            assigneeId: parentTask.assigneeId,
            tags: [...parentTask.tags],
            subtasks: [],
            attachments: [],
            order: parentTask.order + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.tasks.unshift(newTask);
          saveToLocalStorage('tasks', state.tasks);
        }
      }
    },
    addAttachment: (
      state,
      action: PayloadAction<{ taskId: string; attachment: Attachment }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.attachments.push(action.payload.attachment);
        task.updatedAt = new Date().toISOString();
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    deleteAttachment: (
      state,
      action: PayloadAction<{ taskId: string; attachmentId: string }>
    ) => {
      const task = state.tasks.find((t) => t.id === action.payload.taskId);
      if (task) {
        task.attachments = task.attachments.filter((a) => a.id !== action.payload.attachmentId);
        task.updatedAt = new Date().toISOString();
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    duplicateTask: (state, action: PayloadAction<string>) => {
      const original = state.tasks.find((t) => t.id === action.payload);
      if (original) {
        const copy: Task = {
          ...original,
          id: generateId('task'),
          title: `${original.title} (Copy)`,
          subtasks: original.subtasks.map((s) => ({ ...s, id: generateId('sub') })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: original.order + 1,
        };
        state.tasks.unshift(copy);
        saveToLocalStorage('tasks', state.tasks);
      }
    },
    bulkUpdateStatus: (
      state,
      action: PayloadAction<{ taskIds: string[]; status: TaskStatus }>
    ) => {
      state.tasks.forEach((task) => {
        if (action.payload.taskIds.includes(task.id)) {
          task.status = action.payload.status;
          task.updatedAt = new Date().toISOString();
        }
      });
      state.selectedTaskIds = [];
      saveToLocalStorage('tasks', state.tasks);
    },
    bulkUpdateAssignee: (
      state,
      action: PayloadAction<{ taskIds: string[]; assigneeId: string | null }>
    ) => {
      state.tasks.forEach((task) => {
        if (action.payload.taskIds.includes(task.id)) {
          task.assigneeId = action.payload.assigneeId;
          task.updatedAt = new Date().toISOString();
        }
      });
      state.selectedTaskIds = [];
      saveToLocalStorage('tasks', state.tasks);
    },
    bulkDeleteTasks: (state, action: PayloadAction<string[]>) => {
      state.tasks = state.tasks.filter((t) => !action.payload.includes(t.id));
      state.selectedTaskIds = [];
      saveToLocalStorage('tasks', state.tasks);
    },
    setTasks: (state, action: PayloadAction<Task[]>) => {
      state.tasks = action.payload;
      saveToLocalStorage('tasks', state.tasks);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(optimisticMoveTask.pending, (state) => {
        state.isSimulatingLatency = true;
      })
      .addCase(optimisticMoveTask.fulfilled, (state) => {
        state.isSimulatingLatency = false;
      })
      .addCase(optimisticMoveTask.rejected, (state) => {
        state.isSimulatingLatency = false;
      });
  },
});

export const {
  setActiveTask,
  toggleSelectTask,
  selectAllTasks,
  clearSelectedTasks,
  setSimulateError,
  addTask,
  addMultipleTasks,
  updateTask,
  deleteTask,
  moveTaskStatus,
  reorderTasksInColumn,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
  convertSubtaskToTask,
  addAttachment,
  deleteAttachment,
  duplicateTask,
  bulkUpdateStatus,
  bulkUpdateAssignee,
  bulkDeleteTasks,
  setTasks,
} = taskSlice.actions;

export default taskSlice.reducer;
