export interface CaptureResult {
  blob: Blob;
  width: number;
  height: number;
}

export async function captureDisplay(): Promise<CaptureResult> {
  if (!navigator.mediaDevices?.getDisplayMedia) {
    throw new Error('Screen capture is not available in this browser');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 1, max: 5 },
    },
    audio: false,
  });
  const track = stream.getVideoTracks()[0];
  if (!track) {
    stopStream(stream);
    throw new Error('No display surface was selected');
  }

  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await waitForVideo(video);
    await video.play();
    await nextFrame();

    const settings = track.getSettings();
    const width = video.videoWidth || settings.width || 1;
    const height = video.videoHeight || settings.height || 1;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas capture is unavailable');
    context.drawImage(video, 0, 0, width, height);
    const blob = await canvasToBlob(canvas);
    return { blob, width, height };
  } finally {
    stopStream(stream);
  }
}

export function createCaptureFileName(now = new Date()) {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    '-',
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');
  return `Capture ${stamp}.png`;
}

function waitForVideo(video: HTMLVideoElement) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    video.addEventListener('loadedmetadata', () => resolve(), { once: true });
    video.addEventListener('error', () => reject(new Error('Capture preview failed')), {
      once: true,
    });
  });
}

function nextFrame() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Could not create the capture image'));
    }, 'image/png');
  });
}

function stopStream(stream: MediaStream) {
  for (const track of stream.getTracks()) track.stop();
}
