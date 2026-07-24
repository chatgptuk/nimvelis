import { useDesktopStore, type DesktopStore } from './desktop-store';
import { useProductivityStore, type ProductivitySnapshot } from './productivity-store';
import { useSystemStore } from './system-store';

const CHANNEL_NAME = 'nimvelis.aurora.desktop-sync';
const SOURCE_ID = createSourceId();

type DesktopSnapshot = Pick<
  DesktopStore,
  | 'windows'
  | 'zCounter'
  | 'appearance'
  | 'wallpaper'
  | 'hasCompletedWelcome'
  | 'workspaces'
  | 'activeWorkspaceId'
  | 'desktopIconPositions'
  | 'preferences'
>;

interface SyncMessage {
  sourceId: string;
  sentAt: number;
  snapshot: DesktopSnapshot;
}

export function startDesktopSync() {
  if (typeof BroadcastChannel === 'undefined') return () => {};

  const channel = new BroadcastChannel(CHANNEL_NAME);
  let receiving = false;
  let queued = false;
  let stopped = false;

  const publish = () => {
    if (receiving || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (stopped) return;
      const state = useDesktopStore.getState();
      channel.postMessage({
        sourceId: SOURCE_ID,
        sentAt: Date.now(),
        snapshot: pickSnapshot(state),
      } satisfies SyncMessage);
    });
  };

  const unsubscribe = useDesktopStore.subscribe(publish);
  channel.addEventListener('message', (event: MessageEvent<SyncMessage>) => {
    const message = event.data;
    if (!message || message.sourceId === SOURCE_ID || !message.snapshot) return;
    receiving = true;
    useDesktopStore.setState(message.snapshot);
    queueMicrotask(() => {
      receiving = false;
    });
  });

  return () => {
    stopped = true;
    unsubscribe();
    channel.close();
  };
}

export function startSystemSync() {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel('nimvelis.aurora.system-sync');
  let receiving = false;
  const unsubscribe = useSystemStore.subscribe((state) => {
    if (!receiving) {
      channel.postMessage({ sourceId: SOURCE_ID, notifications: state.notifications });
    }
  });
  channel.addEventListener(
    'message',
    (event: MessageEvent<{ sourceId?: string; notifications?: unknown }>) => {
      if (event.data?.sourceId === SOURCE_ID || !Array.isArray(event.data?.notifications)) {
        return;
      }
      receiving = true;
      useSystemStore.setState({ notifications: event.data.notifications });
      queueMicrotask(() => {
        receiving = false;
      });
    },
  );
  return () => {
    unsubscribe();
    channel.close();
  };
}

export function startProductivitySync() {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const channel = new BroadcastChannel('nimvelis.aurora.productivity-sync');
  let receiving = false;
  const unsubscribe = useProductivityStore.subscribe((state) => {
    if (!receiving) {
      channel.postMessage({
        sourceId: SOURCE_ID,
        snapshot: { tasks: state.tasks, events: state.events } satisfies ProductivitySnapshot,
      });
    }
  });
  channel.addEventListener(
    'message',
    (
      event: MessageEvent<{
        sourceId?: string;
        snapshot?: ProductivitySnapshot;
      }>,
    ) => {
      const snapshot = event.data?.snapshot;
      if (
        event.data?.sourceId === SOURCE_ID ||
        !Array.isArray(snapshot?.tasks) ||
        !Array.isArray(snapshot.events)
      ) {
        return;
      }
      receiving = true;
      useProductivityStore.setState(snapshot);
      queueMicrotask(() => {
        receiving = false;
      });
    },
  );
  return () => {
    unsubscribe();
    channel.close();
  };
}

function pickSnapshot(state: DesktopStore): DesktopSnapshot {
  return {
    windows: state.windows,
    zCounter: state.zCounter,
    appearance: state.appearance,
    wallpaper: state.wallpaper,
    hasCompletedWelcome: state.hasCompletedWelcome,
    workspaces: state.workspaces,
    activeWorkspaceId: state.activeWorkspaceId,
    desktopIconPositions: state.desktopIconPositions,
    preferences: state.preferences,
  };
}

function createSourceId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
