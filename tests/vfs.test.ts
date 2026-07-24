import { describe, expect, it } from 'vitest';
import { MemoryVirtualFileSystem, ROOT_DIRECTORY_ID } from '../src/kernel/vfs';

describe('local virtual file system', () => {
  it('creates, reads, renames, and searches local content', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const folder = await files.mkdir(ROOT_DIRECTORY_ID, 'Projects');
    const document = await files.writeFile({
      parentId: folder.id,
      name: 'idea.txt',
      data: new Blob(['An aurora workspace for the browser'], { type: 'text/plain' }),
    });

    expect((await files.readFile(document.id)).text()).resolves.toContain('aurora workspace');
    expect((await files.search('workspace')).map((node) => node.id)).toEqual([document.id]);

    const renamed = await files.rename(document.id, 'concept.txt');
    expect(renamed.name).toBe('concept.txt');
    expect((await files.list(folder.id)).map((node) => node.name)).toEqual(['concept.txt']);
  });

  it('keeps names unique and restores folder trees from Trash', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const first = await files.mkdir(ROOT_DIRECTORY_ID, 'Notes');
    const second = await files.mkdir(ROOT_DIRECTORY_ID, 'Notes');
    const child = await files.writeFile({
      parentId: first.id,
      name: 'today.txt',
      data: new Blob(['hello'], { type: 'text/plain' }),
    });

    expect(second.name).toBe('Notes 2');
    await files.trash(first.id);
    expect((await files.listTrash()).map((node) => node.id)).toContain(first.id);
    expect((await files.get(child.id))?.trashedAt).toBeTypeOf('number');

    await files.restore(first.id);
    expect((await files.get(child.id))?.trashedAt).toBeUndefined();

    await files.trash(first.id);
    await files.deletePermanently(first.id);
    expect(await files.get(child.id)).toBeUndefined();
  });
});
