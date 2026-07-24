import type { ClipboardHistory, ClipboardHistoryEntry } from './types';

const DATABASE_NAME = 'nimvelis.aurora.clipboard';
const DATABASE_VERSION = 1;
const STORE_NAME = 'entries';
const MAX_ENTRIES = 50;
const MAX_TEXT_LENGTH = 20_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

interface StoredClipboardEntry extends ClipboardHistoryEntry {
  data: Blob;
}

abstract class ObservableClipboardHistory implements ClipboardHistory {
  private listeners = new Set<() => void>();

  abstract ready(): Promise<void>;
  abstract list(): Promise<ClipboardHistoryEntry[]>;
  abstract read(id: string): Promise<Blob>;
  abstract addText(text: string): Promise<ClipboardHistoryEntry>;
  abstract addImage(data: Blob): Promise<ClipboardHistoryEntry>;
  abstract setPinned(id: string, pinned: boolean): Promise<void>;
  abstract remove(id: string): Promise<void>;
  abstract clear(): Promise<void>;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  protected emitChange() {
    for (const listener of this.listeners) listener();
  }
}

export class MemoryClipboardHistory extends ObservableClipboardHistory {
  private entries = new Map<string, StoredClipboardEntry>();

  async ready() {}

  async list() {
    return sortEntries([...this.entries.values()]).map(stripData);
  }

  async read(id: string) {
    const entry = this.entries.get(id);
    if (!entry) throw new Error('Clipboard entry not found');
    return entry.data;
  }

  async addText(text: string) {
    const entry = createTextEntry(text);
    this.entries.set(entry.id, entry);
    this.trim();
    this.emitChange();
    return stripData(entry);
  }

  async addImage(data: Blob) {
    const entry = createImageEntry(data);
    this.entries.set(entry.id, entry);
    this.trim();
    this.emitChange();
    return stripData(entry);
  }

  async setPinned(id: string, pinned: boolean) {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.entries.set(id, { ...entry, pinned });
    this.emitChange();
  }

  async remove(id: string) {
    if (this.entries.delete(id)) this.emitChange();
  }

  async clear() {
    this.entries.clear();
    this.emitChange();
  }

  private trim() {
    const removable = sortEntries([...this.entries.values()])
      .filter((entry) => !entry.pinned)
      .slice(MAX_ENTRIES);
    for (const entry of removable) this.entries.delete(entry.id);
  }
}

export class IndexedDbClipboardHistory extends ObservableClipboardHistory {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private channel =
    typeof BroadcastChannel === 'undefined'
      ? null
      : new BroadcastChannel('nimvelis.aurora.clipboard-sync');

  constructor() {
    super();
    this.channel?.addEventListener('message', () => this.emitChange());
  }

  async ready() {
    await this.database();
  }

  async list() {
    const entries = await this.withStore('readonly', (store) =>
      requestToPromise<StoredClipboardEntry[]>(store.getAll()),
    );
    return sortEntries(entries).map(stripData);
  }

  async read(id: string) {
    const entry = await this.withStore('readonly', (store) =>
      requestToPromise<StoredClipboardEntry | undefined>(store.get(id)),
    );
    if (!entry) throw new Error('Clipboard entry not found');
    return entry.data;
  }

  async addText(text: string) {
    const entry = createTextEntry(text);
    await this.put(entry);
    return stripData(entry);
  }

  async addImage(data: Blob) {
    const entry = createImageEntry(data);
    await this.put(entry);
    return stripData(entry);
  }

  async setPinned(id: string, pinned: boolean) {
    const entry = await this.withStore('readonly', (store) =>
      requestToPromise<StoredClipboardEntry | undefined>(store.get(id)),
    );
    if (!entry) return;
    await this.withStore('readwrite', (store) =>
      requestToPromise<IDBValidKey>(store.put({ ...entry, pinned })),
    );
    this.changed();
  }

  async remove(id: string) {
    await this.withStore('readwrite', (store) => requestToPromise<undefined>(store.delete(id)));
    this.changed();
  }

  async clear() {
    await this.withStore('readwrite', (store) => requestToPromise<undefined>(store.clear()));
    this.changed();
  }

  private async put(entry: StoredClipboardEntry) {
    await this.withStore('readwrite', (store) => requestToPromise<IDBValidKey>(store.put(entry)));
    const entries = await this.withStore('readonly', (store) =>
      requestToPromise<StoredClipboardEntry[]>(store.getAll()),
    );
    const removable = sortEntries(entries)
      .filter((candidate) => !candidate.pinned)
      .slice(MAX_ENTRIES);
    if (removable.length > 0) {
      await this.withStore('readwrite', async (store) => {
        await Promise.all(
          removable.map((candidate) => requestToPromise<undefined>(store.delete(candidate.id))),
        );
      });
    }
    this.changed();
  }

  private changed() {
    this.emitChange();
    this.channel?.postMessage({ changedAt: Date.now() });
  }

  private database() {
    if (!this.databasePromise) {
      this.databasePromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('Clipboard database failed'));
      });
    }
    return this.databasePromise;
  }

  private async withStore<T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T>,
  ) {
    const database = await this.database();
    const transaction = database.transaction(STORE_NAME, mode);
    const result = await operation(transaction.objectStore(STORE_NAME));
    await transactionToPromise(transaction);
    return result;
  }
}

function createTextEntry(text: string): StoredClipboardEntry {
  const normalized = text.trim().slice(0, MAX_TEXT_LENGTH);
  if (!normalized) throw new Error('Clipboard text is empty');
  const data = new Blob([normalized], { type: 'text/plain;charset=utf-8' });
  return {
    id: createId(),
    kind: 'text',
    mimeType: 'text/plain',
    preview: normalized.replaceAll(/\s+/g, ' ').slice(0, 180),
    size: data.size,
    createdAt: Date.now(),
    pinned: false,
    data,
  };
}

function createImageEntry(data: Blob): StoredClipboardEntry {
  if (!data.type.startsWith('image/')) throw new Error('Clipboard item is not an image');
  if (data.size <= 0 || data.size > MAX_IMAGE_BYTES) {
    throw new Error('Clipboard images must be between 1 byte and 5 MB');
  }
  return {
    id: createId(),
    kind: 'image',
    mimeType: data.type,
    preview: `${formatBytes(data.size)} image`,
    size: data.size,
    createdAt: Date.now(),
    pinned: false,
    data,
  };
}

function sortEntries<T extends ClipboardHistoryEntry>(entries: T[]) {
  return entries.sort(
    (left, right) => Number(right.pinned) - Number(left.pinned) || right.createdAt - left.createdAt,
  );
}

function stripData(entry: StoredClipboardEntry): ClipboardHistoryEntry {
  return {
    id: entry.id,
    kind: entry.kind,
    mimeType: entry.mimeType,
    preview: entry.preview,
    size: entry.size,
    createdAt: entry.createdAt,
    pinned: entry.pinned,
  };
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Clipboard request failed'));
  });
}

function transactionToPromise(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Clipboard write failed'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Clipboard write aborted'));
  });
}
