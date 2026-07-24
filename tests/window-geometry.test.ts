import { describe, expect, it } from 'vitest';
import { constrainBounds, moveBounds, resizeBounds } from '../src/kernel/window-manager/geometry';

describe('window geometry', () => {
  it('keeps a useful part of the titlebar inside the desktop', () => {
    const result = constrainBounds(
      { x: -900, y: -200, width: 600, height: 420 },
      { width: 1200, height: 760 },
    );

    expect(result.y).toBe(12);
    expect(result.x).toBeGreaterThanOrEqual(12 - result.width + 112);
  });

  it('constrains oversized windows to the available desktop', () => {
    const result = constrainBounds(
      { x: 0, y: 0, width: 1800, height: 1200 },
      { width: 900, height: 600 },
    );

    expect(result).toEqual({ x: 12, y: 12, width: 876, height: 576 });
  });

  it('resizes from the north-west while preserving the opposite corner', () => {
    const original = { x: 200, y: 160, width: 500, height: 360 };
    const resized = resizeBounds(original, 'nw', -40, -25, {
      width: 300,
      height: 220,
    });

    expect(resized).toEqual({ x: 160, y: 135, width: 540, height: 385 });
    expect(resized.x + resized.width).toBe(original.x + original.width);
    expect(resized.y + resized.height).toBe(original.y + original.height);
  });

  it('moves bounds without mutating size', () => {
    expect(moveBounds({ x: 20, y: 30, width: 400, height: 300 }, 15, -8)).toEqual({
      x: 35,
      y: 22,
      width: 400,
      height: 300,
    });
  });
});
