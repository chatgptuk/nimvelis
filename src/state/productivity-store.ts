import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TaskPriority = 'low' | 'normal' | 'high';
export type CalendarEventColor = 'teal' | 'blue' | 'violet' | 'rose' | 'amber';

export interface LocalTask {
  id: string;
  title: string;
  dueDate?: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface LocalCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  color: CalendarEventColor;
  createdAt: number;
}

interface ProductivityState {
  tasks: LocalTask[];
  events: LocalCalendarEvent[];
  addTask: (task: { title: string; dueDate?: string; priority?: TaskPriority }) => string | null;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearCompletedTasks: () => void;
  addEvent: (event: {
    title: string;
    date: string;
    time?: string;
    color?: CalendarEventColor;
  }) => string | null;
  removeEvent: (id: string) => void;
}

export type ProductivitySnapshot = Pick<ProductivityState, 'tasks' | 'events'>;

export const useProductivityStore = create<ProductivityState>()(
  persist(
    (set) => ({
      tasks: [],
      events: [],

      addTask: ({ title: rawTitle, dueDate, priority = 'normal' }) => {
        const title = rawTitle.trim().slice(0, 160);
        if (!title) return null;
        const id = createId('task');
        set((state) => ({
          tasks: [
            {
              id,
              title,
              dueDate: isDateKey(dueDate) ? dueDate : undefined,
              priority,
              completed: false,
              createdAt: Date.now(),
            },
            ...state.tasks,
          ].slice(0, 500),
        }));
        return id;
      },

      toggleTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completed: !task.completed,
                  completedAt: task.completed ? undefined : Date.now(),
                }
              : task,
          ),
        })),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        })),

      clearCompletedTasks: () =>
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.completed),
        })),

      addEvent: ({ title: rawTitle, date, time, color = 'blue' }) => {
        const title = rawTitle.trim().slice(0, 160);
        if (!title || !isDateKey(date)) return null;
        const id = createId('event');
        set((state) => ({
          events: [
            ...state.events,
            {
              id,
              title,
              date,
              time: isTimeKey(time) ? time : undefined,
              color,
              createdAt: Date.now(),
            },
          ].slice(-500),
        }));
        return id;
      },

      removeEvent: (id) =>
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        })),
    }),
    {
      name: 'nimvelis.aurora.productivity',
      storage: createJSONStorage(() => window.localStorage),
      version: 1,
      partialize: (state): ProductivitySnapshot => ({
        tasks: state.tasks,
        events: state.events,
      }),
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        return {
          ...currentState,
          tasks: sanitizeTasks(persisted.tasks),
          events: sanitizeEvents(persisted.events),
        };
      },
    },
  ),
);

function sanitizeTasks(value: unknown): LocalTask[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 500).flatMap((candidate): LocalTask[] => {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      typeof candidate.createdAt !== 'number'
    ) {
      return [];
    }
    return [
      {
        id: candidate.id,
        title: candidate.title.trim().slice(0, 160),
        dueDate: isDateKey(candidate.dueDate) ? candidate.dueDate : undefined,
        priority: isPriority(candidate.priority) ? candidate.priority : 'normal',
        completed: Boolean(candidate.completed),
        createdAt: candidate.createdAt,
        completedAt: typeof candidate.completedAt === 'number' ? candidate.completedAt : undefined,
      },
    ];
  });
}

function sanitizeEvents(value: unknown): LocalCalendarEvent[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-500).flatMap((candidate): LocalCalendarEvent[] => {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      typeof candidate.title !== 'string' ||
      !isDateKey(candidate.date) ||
      typeof candidate.createdAt !== 'number'
    ) {
      return [];
    }
    return [
      {
        id: candidate.id,
        title: candidate.title.trim().slice(0, 160),
        date: candidate.date,
        time: isTimeKey(candidate.time) ? candidate.time : undefined,
        color: isEventColor(candidate.color) ? candidate.color : 'blue',
        createdAt: candidate.createdAt,
      },
    ];
  });
}

function isPriority(value: unknown): value is TaskPriority {
  return value === 'low' || value === 'normal' || value === 'high';
}

function isEventColor(value: unknown): value is CalendarEventColor {
  return ['teal', 'blue', 'violet', 'rose', 'amber'].includes(String(value));
}

function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeKey(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function createId(prefix: string) {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
}
