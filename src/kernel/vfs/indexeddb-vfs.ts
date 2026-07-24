import { MemoryVirtualFileSystem } from './memory-vfs';
import type { VfsNode } from './types';

const DATABASE_NAME = 'nimvelis.aurora.files';
const DATABASE_VERSION = 1;
const NODES_STORE = 'nodes';
const CONTENTS_STORE = 'contents';
const SYNC_CHANNEL = 'nimvelis.aurora.files-sync';

interface ContentRecord {
  id: string;
  data: Blob;
}

export class IndexedDbVirtualFileSystem extends MemoryVirtualFileSystem {
  private database?: IDBDatabase;
  private initialization?: Promise<void>;
  private channel?: BroadcastChannel;
  private readonly sourceId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  constructor() {
    super(false);
  }

  override ready() {
    this.initialization ??= this.initialize();
    return this.initialization;
  }

  protected override async commit() {
    const database = await this.getDatabase();
    const transaction = database.transaction([NODES_STORE, CONTENTS_STORE], 'readwrite');
    const nodeStore = transaction.objectStore(NODES_STORE);
    const contentStore = transaction.objectStore(CONTENTS_STORE);
    nodeStore.clear();
    contentStore.clear();
    for (const node of this.nodes.values()) nodeStore.put(node);
    for (const [id, data] of this.contents) contentStore.put({ id, data } satisfies ContentRecord);
    await transactionComplete(transaction);
    await super.commit();
    this.channel?.postMessage({ sourceId: this.sourceId });
  }

  private async initialize() {
    const database = await this.getDatabase();
    const transaction = database.transaction([NODES_STORE, CONTENTS_STORE], 'readonly');
    const nodes = await requestResult<VfsNode[]>(transaction.objectStore(NODES_STORE).getAll());
    const contents = await requestResult<ContentRecord[]>(
      transaction.objectStore(CONTENTS_STORE).getAll(),
    );
    await transactionComplete(transaction);

    for (const node of nodes) this.nodes.set(node.id, node);
    for (const content of contents) this.contents.set(content.id, content.data);
    if (this.nodes.size === 0) {
      this.seed();
      await this.commit();
    }
    this.startSync();
  }

  private async getDatabase() {
    this.database ??= await openDatabase();
    return this.database;
  }

  private startSync() {
    if (typeof BroadcastChannel === 'undefined' || this.channel) return;
    this.channel = new BroadcastChannel(SYNC_CHANNEL);
    this.channel.addEventListener('message', (event: MessageEvent<{ sourceId?: string }>) => {
      if (event.data?.sourceId === this.sourceId) return;
      void this.reloadFromDatabase();
    });
  }

  private async reloadFromDatabase() {
    const database = await this.getDatabase();
    const transaction = database.transaction([NODES_STORE, CONTENTS_STORE], 'readonly');
    const nodes = await requestResult<VfsNode[]>(transaction.objectStore(NODES_STORE).getAll());
    const contents = await requestResult<ContentRecord[]>(
      transaction.objectStore(CONTENTS_STORE).getAll(),
    );
    await transactionComplete(transaction);
    this.nodes.clear();
    this.contents.clear();
    for (const node of nodes) this.nodes.set(node.id, node);
    for (const content of contents) this.contents.set(content.id, content.data);
    await super.commit();
  }
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(NODES_STORE)) {
        database.createObjectStore(NODES_STORE, { keyPath: 'id' });
      }
      if (!database.objectStoreNames.contains(CONTENTS_STORE)) {
        database.createObjectStore(CONTENTS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open local files.'));
  });
}

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local file request failed.'));
  });
}

function transactionComplete(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Local file transaction failed.'));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Local file transaction was cancelled.'));
  });
}
