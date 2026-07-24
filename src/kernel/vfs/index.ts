import { IndexedDbVirtualFileSystem } from './indexeddb-vfs';
import { MemoryVirtualFileSystem, isTextMimeType } from './memory-vfs';

export * from './types';
export { IndexedDbVirtualFileSystem, MemoryVirtualFileSystem, isTextMimeType };

export const localFileSystem =
  typeof indexedDB === 'undefined'
    ? new MemoryVirtualFileSystem()
    : new IndexedDbVirtualFileSystem();
