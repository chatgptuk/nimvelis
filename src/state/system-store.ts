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

export interface LocalSession {
  profileName: string;
  locked: boolean;
  focusMode: boolean;
  quietMedia: boolean;
  interfaceBrightness: number;
  lastUnlockedAt: number;
}

export const DEFAULT_LOCAL_SESSION: LocalSession = {
  profileName: 'Local space',
  locked: false,
  focusMode: false,
  quietMedia: false,
  interfaceBrightness: 1,
  lastUnlockedAt: 0,
};

export interface SystemState {
  notifications: SystemNotification[];
  session: LocalSession;
  addNotification: (message: string, tone?: NotificationTone) => string;
  markAllRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  lockSession: () => void;
  unlockSession: () => void;
  setProfileName: (name: string) => void;
  setFocusMode: (enabled: boolean) => void;
  setQuietMedia: (enabled: boolean) => void;
  setInterfaceBrightness: (brightness: number) => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      notifications: [],
      session: DEFAULT_LOCAL_SESSION,
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
      lockSession: () =>
        set((state) => ({
          session: { ...state.session, locked: true },
        })),
      unlockSession: () =>
        set((state) => ({
          session: {
            ...state.session,
            locked: false,
            lastUnlockedAt: Date.now(),
          },
        })),
      setProfileName: (rawName) => {
        const profileName = rawName.trim().slice(0, 32);
        if (!profileName) return;
        set((state) => ({
          session: { ...state.session, profileName },
        }));
      },
      setFocusMode: (focusMode) =>
        set((state) => ({
          session: { ...state.session, focusMode },
        })),
      setQuietMedia: (quietMedia) =>
        set((state) => ({
          session: { ...state.session, quietMedia },
        })),
      setInterfaceBrightness: (interfaceBrightness) =>
        set((state) => ({
          session: {
            ...state.session,
            interfaceBrightness: Math.min(1, Math.max(0.45, interfaceBrightness)),
          },
        })),
    }),
    {
      name: 'nimvelis.aurora.notifications',
      storage: createJSONStorage(() => window.localStorage),
      version: 2,
      partialize: (state) => ({
        notifications: state.notifications,
        session: state.session,
      }),
      migrate: (persistedState) => persistedState,
      merge: (persistedState, currentState) => {
        const persisted = isRecord(persistedState) ? persistedState : {};
        return {
          ...currentState,
          notifications: sanitizeNotifications(persisted.notifications),
          session: sanitizeSession(persisted.session),
        };
      },
    },
  ),
);

function createNotificationId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeSession(value: unknown): LocalSession {
  if (!isRecord(value)) return DEFAULT_LOCAL_SESSION;
  return {
    profileName:
      typeof value.profileName === 'string' && value.profileName.trim()
        ? value.profileName.trim().slice(0, 32)
        : DEFAULT_LOCAL_SESSION.profileName,
    locked: Boolean(value.locked),
    focusMode: Boolean(value.focusMode),
    quietMedia: Boolean(value.quietMedia),
    interfaceBrightness:
      typeof value.interfaceBrightness === 'number' && Number.isFinite(value.interfaceBrightness)
        ? Math.min(1, Math.max(0.45, value.interfaceBrightness))
        : DEFAULT_LOCAL_SESSION.interfaceBrightness,
    lastUnlockedAt:
      typeof value.lastUnlockedAt === 'number' && Number.isFinite(value.lastUnlockedAt)
        ? value.lastUnlockedAt
        : 0,
  };
}

function sanitizeNotifications(value: unknown): SystemNotification[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 40).flatMap((candidate) => {
    if (
      !isRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      typeof candidate.message !== 'string' ||
      typeof candidate.createdAt !== 'number' ||
      !['neutral', 'success', 'error'].includes(String(candidate.tone))
    ) {
      return [];
    }
    return [
      {
        id: candidate.id,
        message: candidate.message.slice(0, 240),
        tone: candidate.tone as NotificationTone,
        createdAt: candidate.createdAt,
        read: Boolean(candidate.read),
      },
    ];
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
