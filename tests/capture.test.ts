import { describe, expect, it } from 'vitest';
import { createCaptureFileName } from '../src/apps/capture/capture';

describe('Capture', () => {
  it('creates a stable local PNG filename', () => {
    expect(createCaptureFileName(new Date(2026, 6, 24, 9, 5, 7))).toBe(
      'Capture 20260724-090507.png',
    );
  });
});
