import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NotificationTone = 'neutral' | 'success' | 'error';

export interface SystemNotification {
  id: string;
  message: string;
  tone: NotificationTone;
  createdAt: number;
  read: boolean;
}

interface SystemState {
  notifications: SystemNotification[];
  addNotification: (message: string, tone?: NotificationTone) => string;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (message, tone = 'neutral') => {
        const id = createNotificationId();
        set((state) => ({
          notifications: [
            {
              id,
              message: message.trim().slice(0, 240),
              tone,
              createdAt: Date.now(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 40),
        }));
        return id;
      },
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'nimvelis.aurora.notifications',
      storage: createJSONStorage(() => window.localStorage),
      version: 1,
      partialize: (state) => ({ notifications: state.notifications }),
    },
  ),
);

function createNotificationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
