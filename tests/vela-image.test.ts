import { describe, expect, it } from 'vitest';
import {
  MAX_VELA_SOURCE_IMAGE_BYTES,
  formatVelaImageSize,
  validateVelaImageFile,
} from '../src/apps/vela/image';

describe('Vela image attachments', () => {
  it('accepts the three browser-compressed image formats', () => {
    expect(validateVelaImageFile({ type: 'image/jpeg', size: 12_000 })).toBeNull();
    expect(validateVelaImageFile({ type: 'image/png', size: 12_000 })).toBeNull();
    expect(validateVelaImageFile({ type: 'image/webp', size: 12_000 })).toBeNull();
  });

  it('rejects unsupported, empty, and oversized files', () => {
    expect(validateVelaImageFile({ type: 'image/svg+xml', size: 12_000 })).toContain(
      'PNG, JPEG, or WebP',
    );
    expect(validateVelaImageFile({ type: 'image/png', size: 0 })).toContain('empty');
    expect(
      validateVelaImageFile({
        type: 'image/png',
        size: MAX_VELA_SOURCE_IMAGE_BYTES + 1,
      }),
    ).toContain('smaller than 10 MB');
  });

  it('formats compact image sizes for the composer', () => {
    expect(formatVelaImageSize(128_000)).toBe('128 KB');
    expect(formatVelaImageSize(1_250_000)).toBe('1.3 MB');
  });
});
