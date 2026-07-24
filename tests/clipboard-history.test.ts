import { describe, expect, it } from 'vitest';
import { MemoryClipboardHistory } from '../src/kernel/clipboard';

describe('clipboard history', () => {
  it('stores text and images locally and keeps pinned entries first', async () => {
    const history = new MemoryClipboardHistory();
    const text = await history.addText('  Nimvelis clipboard text  ');
    const image = await history.addImage(new Blob(['image'], { type: 'image/png' }));

    await history.setPinned(text.id, true);
    const entries = await history.list();

    expect(entries.map((entry) => entry.id)).toEqual([text.id, image.id]);
    expect(entries[0]).toMatchObject({
      kind: 'text',
      preview: 'Nimvelis clipboard text',
      pinned: true,
    });
    expect(await (await history.read(text.id)).text()).toBe('Nimvelis clipboard text');
  });

  it('rejects empty text and non-image blobs', async () => {
    const history = new MemoryClipboardHistory();
    await expect(history.addText('   ')).rejects.toThrow('empty');
    await expect(history.addImage(new Blob(['not image'], { type: 'text/plain' }))).rejects.toThrow(
      'not an image',
    );
  });

  it('clears clipboard data and notifies subscribers', async () => {
    const history = new MemoryClipboardHistory();
    let changes = 0;
    const unsubscribe = history.subscribe(() => {
      changes += 1;
    });
    await history.addText('Keep me briefly');
    await history.clear();
    unsubscribe();

    expect(changes).toBe(2);
    expect(await history.list()).toEqual([]);
  });
});
