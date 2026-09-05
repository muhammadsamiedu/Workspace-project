export type SocketEvent =
  | { type: 'TASK_MOVED'; payload: { taskId: string; fromStatus: string; toStatus: string; actorName: string; taskTitle: string } }
  | { type: 'COMMENT_ADDED'; payload: { taskId: string; commentId: string; content: string; authorName: string; taskTitle: string } }
  | { type: 'SUBTASK_COMPLETED'; payload: { taskId: string; subtaskId: string; subtaskTitle: string; actorName: string } }
  | { type: 'TEAM_NOTIFICATION'; payload: { title: string; message: string; type: 'assigned' | 'mentioned' | 'due_soon' | 'system' } };

type SocketListener = (event: SocketEvent) => void;

class MockSocketService {
  private intervalId: NodeJS.Timeout | null = null;
  private listeners: Set<SocketListener> = new Set();
  private isRunning: boolean = false;
  private connectionStatus: 'connected' | 'reconnecting' | 'disconnected' = 'connected';

  public subscribe(listener: SocketListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStatus(): 'connected' | 'reconnecting' | 'disconnected' {
    return this.connectionStatus;
  }

  public start(intervalMs: number = 35000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.connectionStatus = 'connected';

    this.intervalId = setInterval(() => {
      this.triggerRandomEvent();
    }, intervalMs);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.connectionStatus = 'disconnected';
  }

  public triggerRandomEvent(): void {
    if (this.listeners.size === 0) return;

    const eventPool: SocketEvent[] = [
      {
        type: 'COMMENT_ADDED',
        payload: {
          taskId: 'task-101',
          commentId: `comm_${Date.now()}`,
          content: 'Just tested the optimistic rollback reducer on Chrome, looking solid! 🔥',
          authorName: 'Sarah Chen',
          taskTitle: 'Implement optimistic state update and rollback in Redux',
        },
      },
      {
        type: 'TASK_MOVED',
        payload: {
          taskId: 'task-102',
          fromStatus: 'in_progress',
          toStatus: 'review',
          actorName: 'Marcus Brody',
          taskTitle: 'Design accessible modal dialogs with light-dismiss',
        },
      },
      {
        type: 'SUBTASK_COMPLETED',
        payload: {
          taskId: 'task-103',
          subtaskId: 'sub-8',
          subtaskTitle: 'Export JSON file generation',
          actorName: 'Sarah Chen',
        },
      },
      {
        type: 'TEAM_NOTIFICATION',
        payload: {
          title: 'Design Review Ready',
          message: 'Marcus Brody requested your review on "Design accessible modal dialogs"',
          type: 'mentioned',
        },
      },
    ];

    const randomEvent = eventPool[Math.floor(Math.random() * eventPool.length)];
    this.listeners.forEach((listener) => {
      try {
        listener(randomEvent);
      } catch (err) {
        console.error('Error dispatching mock socket event:', err);
      }
    });
  }
}

export const mockSocket = new MockSocketService();
