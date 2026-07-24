import { ROOT_DIRECTORY_ID, type VfsNode, type VirtualFileSystem } from '../../kernel/vfs';

export const MEMO_DIRECTORY_NAME = 'Memos';

export interface MemoFileReference {
  fileId?: string;
  fileName?: string;
  parentId?: string;
}

interface SaveMemoFileInput extends MemoFileReference {
  content: string;
  now?: Date;
}

const pendingDirectories = new WeakMap<VirtualFileSystem, Promise<VfsNode>>();

export async function saveMemoFile(
  files: VirtualFileSystem,
  input: SaveMemoFileInput,
): Promise<VfsNode> {
  await files.ready();
  const current = input.fileId ? await files.get(input.fileId) : undefined;
  const currentFile = current?.kind === 'file' ? current : undefined;
  const parentId =
    currentFile?.parentId ?? (await resolveParentDirectory(files, input.parentId)).id;
  const name =
    currentFile?.name ??
    (input.fileName?.trim() || createMemoFileName(input.content, input.now ?? new Date()));

  return files.writeFile({
    id: currentFile?.id,
    parentId,
    name,
    data: new Blob([input.content], { type: 'text/markdown' }),
    mimeType: 'text/markdown',
  });
}

export function createMemoFileName(content: string, now: Date): string {
  const firstLine = content
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean)
    ?.replace(/^#{1,6}\s+/, '')
    .replaceAll('/', '-')
    .replaceAll('\0', '')
    .trim();
  const title = firstLine?.slice(0, 72).trim();

  if (title) return title.toLocaleLowerCase().endsWith('.md') ? title : `${title}.md`;

  const date = [now.getFullYear(), padNumber(now.getMonth() + 1), padNumber(now.getDate())].join(
    '-',
  );
  const time = `${padNumber(now.getHours())}-${padNumber(now.getMinutes())}`;
  return `Memo ${date} ${time}.md`;
}

async function resolveParentDirectory(
  files: VirtualFileSystem,
  requestedParentId?: string,
): Promise<VfsNode> {
  if (requestedParentId && requestedParentId !== ROOT_DIRECTORY_ID) {
    const requestedParent = await files.get(requestedParentId);
    if (requestedParent?.kind === 'directory' && requestedParent.trashedAt === undefined) {
      return requestedParent;
    }
  }

  const pending = pendingDirectories.get(files);
  if (pending) return pending;

  const directory = findOrCreateMemoDirectory(files);
  pendingDirectories.set(files, directory);
  try {
    return await directory;
  } finally {
    pendingDirectories.delete(files);
  }
}

async function findOrCreateMemoDirectory(files: VirtualFileSystem): Promise<VfsNode> {
  const rootItems = await files.list(ROOT_DIRECTORY_ID);
  const existing = rootItems.find(
    (node) =>
      node.kind === 'directory' &&
      (node.name === MEMO_DIRECTORY_NAME || /^Memos \d+$/.test(node.name)),
  );
  return existing ?? files.mkdir(ROOT_DIRECTORY_ID, MEMO_DIRECTORY_NAME);
}

function padNumber(value: number): string {
  return String(value).padStart(2, '0');
}
