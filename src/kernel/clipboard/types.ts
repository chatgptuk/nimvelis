export type ClipboardEntryKind = 'text' | 'image';

export interface ClipboardHistoryEntry {
  id: string;
  kind: ClipboardEntryKind;
  mimeType: string;
  preview: string;
  size: number;
  createdAt: number;
  pinned: boolean;
}

export interface ClipboardHistory {
  ready(): Promise<void>;
  subscribe(listener: () => void): () => void;
  list(): Promise<ClipboardHistoryEntry[]>;
  read(id: string): Promise<Blob>;
  addText(text: string): Promise<ClipboardHistoryEntry>;
  addImage(data: Blob): Promise<ClipboardHistoryEntry>;
  setPinned(id: string, pinned: boolean): Promise<void>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}
