import { describe, expect, it } from 'vitest';
import {
  clampDesktopIconPosition,
  getDefaultDesktopIconPosition,
} from '../src/kernel/desktop-icons/geometry';

describe('desktop icon geometry', () => {
  it('keeps dragged icons inside the desktop and above the Shelf', () => {
    const viewport = { width: 800, height: 600 };

    expect(clampDesktopIconPosition({ x: -200, y: 900 }, viewport)).toEqual({
      x: 12,
      y: 414,
    });
  });

  it('wraps default icons into a second column on short desktops', () => {
    const viewport = { width: 800, height: 400 };
    const first = getDefaultDesktopIconPosition(0, viewport);
    const third = getDefaultDesktopIconPosition(2, viewport);

    expect(third.x).toBeLessThan(first.x);
    expect(third.y).toBe(first.y);
  });
});
