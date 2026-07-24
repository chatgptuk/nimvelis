export const VELA_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';
export const MAX_VELA_SOURCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VELA_ENCODED_IMAGE_BYTES = 2_500_000;
export const MAX_VELA_IMAGE_EDGE = 1_600;

const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export interface VelaImageAttachment {
  dataUrl: string;
  name: string;
  mimeType: string;
  width: number;
  height: number;
  size: number;
}

export function validateVelaImageFile(file: Pick<File, 'size' | 'type'>): string | null {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return 'Choose a PNG, JPEG, or WebP image.';
  }
  if (file.size <= 0) return 'This image is empty.';
  if (file.size > MAX_VELA_SOURCE_IMAGE_BYTES) {
    return 'Choose an image smaller than 10 MB.';
  }
  return null;
}

export async function prepareVelaImage(file: File): Promise<VelaImageAttachment> {
  const validationError = validateVelaImageFile(file);
  if (validationError) throw new Error(validationError);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('This image could not be decoded.');
  }

  try {
    if (bitmap.width < 1 || bitmap.height < 1) {
      throw new Error('This image has invalid dimensions.');
    }

    let scale = Math.min(1, MAX_VELA_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    let quality = 0.84;
    let output: Blob | null = null;
    let outputWidth = 0;
    let outputHeight = 0;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      outputWidth = Math.max(1, Math.round(bitmap.width * scale));
      outputHeight = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const context = canvas.getContext('2d', { alpha: true });
      if (!context) throw new Error('Image processing is unavailable in this browser.');

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
      output = await canvasToBlob(canvas, 'image/webp', quality);

      if (output.size <= MAX_VELA_ENCODED_IMAGE_BYTES) break;
      scale *= 0.78;
      quality = Math.max(0.5, quality - 0.1);
    }

    if (!output || output.size > MAX_VELA_ENCODED_IMAGE_BYTES) {
      throw new Error(
        'This image is still too detailed after compression. Choose a smaller image.',
      );
    }

    return {
      dataUrl: await blobToDataUrl(output),
      name: file.name.slice(0, 120) || 'Attached image',
      mimeType: output.type || 'image/webp',
      width: outputWidth,
      height: outputHeight,
      size: output.size,
    };
  } finally {
    bitmap.close();
  }
}

export function formatVelaImageSize(bytes: number): string {
  if (bytes < 1_000_000) return `${Math.max(1, Math.round(bytes / 1_000))} KB`;
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('This image could not be compressed.'));
      },
      type,
      quality,
    );
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This image could not be read.'));
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('This image could not be encoded.'));
    };
    reader.readAsDataURL(blob);
  });
}
