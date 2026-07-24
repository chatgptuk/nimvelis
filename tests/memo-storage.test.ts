import { describe, expect, it } from 'vitest';
import { createMemoFileName, saveMemoFile } from '../src/apps/memo/storage';
import { MemoryVirtualFileSystem, ROOT_DIRECTORY_ID } from '../src/kernel/vfs';

describe('Memo file storage', () => {
  it('creates a discoverable Markdown file in the Memos directory', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const node = await saveMemoFile(files, {
      content: '# Project idea\n\nMake the first draft smaller.',
      now: new Date(2026, 6, 23, 14, 5),
    });

    expect(node.name).toBe('Project idea.md');
    expect(node.mimeType).toBe('text/markdown');
    expect(await (await files.readFile(node.id)).text()).toContain('first draft');

    const rootItems = await files.list(ROOT_DIRECTORY_ID);
    const memoDirectory = rootItems.find((item) => item.name === 'Memos');
    expect(memoDirectory).toMatchObject({ kind: 'directory' });
    expect(await files.list(memoDirectory!.id)).toEqual([node]);
  });

  it('updates the same file instead of creating duplicate memos', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const original = await saveMemoFile(files, { content: 'Stable title\nFirst version' });
    const updated = await saveMemoFile(files, {
      fileId: original.id,
      fileName: original.name,
      parentId: original.parentId,
      content: 'A changed first line\nSecond version',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Stable title.md');
    expect(await (await files.readFile(updated.id)).text()).toContain('Second version');
    expect(await files.list(original.parentId)).toHaveLength(1);
  });

  it('recovers a missing file inside its existing memo directory', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const memoDirectory = await files.mkdir(ROOT_DIRECTORY_ID, 'Memos');
    const recovered = await saveMemoFile(files, {
      fileId: 'missing-file',
      fileName: 'Recovered memo.md',
      parentId: memoDirectory.id,
      content: 'Recovered content',
    });

    expect(recovered.parentId).toBe(memoDirectory.id);
    expect(recovered.name).toBe('Recovered memo.md');
  });

  it('uses a readable dated name when a memo has no title', () => {
    expect(createMemoFileName('', new Date(2026, 6, 23, 9, 7))).toBe('Memo 2026-07-23 09-07.md');
  });
});
