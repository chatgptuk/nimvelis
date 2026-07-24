export type PwaUpdateState = 'checking' | 'current' | 'available' | 'unsupported';

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface PwaSnapshot {
  updateState: PwaUpdateState;
  installAvailable: boolean;
  installed: boolean;
}

let registration: ServiceWorkerRegistration | undefined;
let installPrompt: InstallPromptEvent | undefined;
let snapshot: PwaSnapshot = {
  updateState: 'checking',
  installAvailable: false,
  installed: globalThis.matchMedia?.('(display-mode: standalone)').matches ?? false,
};
const listeners = new Set<() => void>();

export function subscribePwa(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPwaSnapshot() {
  return snapshot;
}

export function registerPwa() {
  if (!('serviceWorker' in navigator)) {
    updateSnapshot({ updateState: 'unsupported' });
    return;
  }

  globalThis.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as InstallPromptEvent;
    updateSnapshot({ installAvailable: true });
  });
  globalThis.addEventListener('appinstalled', () => {
    installPrompt = undefined;
    updateSnapshot({ installAvailable: false, installed: true });
  });

  void navigator.serviceWorker.register('/sw.js').then((nextRegistration) => {
    registration = nextRegistration;
    if (registration.waiting) updateSnapshot({ updateState: 'available' });
    else updateSnapshot({ updateState: 'current' });

    registration.addEventListener('updatefound', () => {
      const worker = registration?.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          updateSnapshot({ updateState: 'available' });
        }
      });
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    globalThis.location.reload();
  });
}

export async function checkForPwaUpdate() {
  if (!registration) return;
  updateSnapshot({ updateState: 'checking' });
  try {
    await registration.update();
    updateSnapshot({ updateState: registration.waiting ? 'available' : 'current' });
  } catch {
    updateSnapshot({ updateState: 'current' });
  }
}

export function applyPwaUpdate() {
  registration?.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

export async function promptPwaInstall() {
  if (!installPrompt) return false;
  await installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  if (choice.outcome === 'accepted') {
    installPrompt = undefined;
    updateSnapshot({ installAvailable: false, installed: true });
    return true;
  }
  return false;
}

function updateSnapshot(next: Partial<PwaSnapshot>) {
  snapshot = { ...snapshot, ...next };
  for (const listener of listeners) listener();
}
