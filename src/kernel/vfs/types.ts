export const ROOT_DIRECTORY_ID = 'root';

export type VfsNodeKind = 'directory' | 'file';

export interface VfsNode {
  id: string;
  parentId: string;
  name: string;
  kind: VfsNodeKind;
  mimeType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  trashedAt?: number;
  favorite?: boolean;
  lastOpenedAt?: number;
}

export interface WriteFileInput {
  id?: string;
  parentId: string;
  name: string;
  data: Blob;
  mimeType?: string;
}

export interface VirtualFileSystem {
  ready(): Promise<void>;
  subscribe(listener: () => void): () => void;
  list(parentId: string): Promise<VfsNode[]>;
  listTrash(): Promise<VfsNode[]>;
  get(id: string): Promise<VfsNode | undefined>;
  readFile(id: string): Promise<Blob>;
  writeFile(input: WriteFileInput): Promise<VfsNode>;
  mkdir(parentId: string, name: string): Promise<VfsNode>;
  rename(id: string, name: string): Promise<VfsNode>;
  move(id: string, parentId: string): Promise<VfsNode>;
  copy(id: string, parentId: string): Promise<VfsNode>;
  setFavorite(id: string, favorite: boolean): Promise<void>;
  touch(id: string): Promise<void>;
  listFavorites(): Promise<VfsNode[]>;
  listRecent(limit?: number): Promise<VfsNode[]>;
  listDirectories(): Promise<VfsNode[]>;
  trash(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  emptyTrash(): Promise<void>;
  search(query: string): Promise<VfsNode[]>;
}
