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

  it('copies and moves folder trees and exposes favorites and recent items', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const source = await files.mkdir(ROOT_DIRECTORY_ID, 'Source');
    const destination = await files.mkdir(ROOT_DIRECTORY_ID, 'Destination');
    const document = await files.writeFile({
      parentId: source.id,
      name: 'notes.md',
      data: new Blob(['# Local work'], { type: 'text/markdown' }),
    });

    const copiedFolder = await files.copy(source.id, destination.id);
    const copiedChildren = await files.list(copiedFolder.id);
    expect(copiedChildren.map((node) => node.name)).toEqual(['notes.md']);
    expect(await (await files.readFile(copiedChildren[0].id)).text()).toContain('Local work');

    await files.move(document.id, destination.id);
    expect((await files.list(source.id)).map((node) => node.id)).not.toContain(document.id);
    expect((await files.list(destination.id)).map((node) => node.id)).toContain(document.id);

    await files.setFavorite(document.id, true);
    await files.touch(document.id);
    expect((await files.listFavorites()).map((node) => node.id)).toContain(document.id);
    expect((await files.listRecent(1))[0]?.id).toBe(document.id);
  });
});
