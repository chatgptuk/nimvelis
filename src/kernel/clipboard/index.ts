import { IndexedDbClipboardHistory, MemoryClipboardHistory } from './history';

export * from './history';
export * from './types';

export const localClipboardHistory =
  typeof indexedDB === 'undefined' ? new MemoryClipboardHistory() : new IndexedDbClipboardHistory();
