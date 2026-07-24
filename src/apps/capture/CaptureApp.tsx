import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import { ROOT_DIRECTORY_ID } from '../../kernel/vfs';
import { captureDisplay, createCaptureFileName, type CaptureResult } from './capture';
import './capture.css';

export function CaptureApp({ system }: SystemAppProps) {
  const [capture, setCapture] = useState<CaptureResult | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [savedName, setSavedName] = useState('');
  const previewUrl = useMemo(() => (capture ? URL.createObjectURL(capture.blob) : ''), [capture]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const takeCapture = async () => {
    setCapturing(true);
    setSavedName('');
    try {
      setCapture(await captureDisplay());
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        system.notify('Screen sharing was cancelled', 'neutral');
      } else {
        system.notify(error instanceof Error ? error.message : 'Capture failed', 'error');
      }
    } finally {
      setCapturing(false);
    }
  };

  const saveCapture = async () => {
    if (!capture) return;
    try {
      const name = createCaptureFileName();
      const file = await system.files.writeFile({
        parentId: ROOT_DIRECTORY_ID,
        name,
        data: capture.blob,
        mimeType: 'image/png',
      });
      setSavedName(file.name);
      system.notify(`${file.name} saved to Files`, 'success');
    } catch (error) {
      system.notify(error instanceof Error ? error.message : 'Could not save capture', 'error');
    }
  };

  const copyCapture = async () => {
    if (!capture) return;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
        throw new Error('Image clipboard is unavailable');
      }
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': capture.blob })]);
      await system.clipboard.addImage(capture.blob);
      system.notify('Capture copied and added to Stash', 'success');
    } catch {
      system.notify('Your browser did not allow image clipboard writing', 'error');
    }
  };

  return (
    <div className="capture-app">
      <header className="capture-toolbar">
        <div>
          <span className="capture-toolbar__icon">
            <Icon name="capture" size={18} />
          </span>
          <span>
            <strong>Capture</strong>
            <small>Explicit browser screen sharing</small>
          </span>
        </div>
        <div>
          {capture ? (
            <>
              <button type="button" onClick={() => void copyCapture()}>
                <Icon name="clipboard" size={15} />
                Copy
              </button>
              <button type="button" onClick={() => void saveCapture()}>
                <Icon name="files" size={15} />
                Save to Files
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="is-primary"
            onClick={() => void takeCapture()}
            disabled={capturing}
          >
            <Icon name="capture" size={15} />
            {capturing ? 'Choose a surface…' : capture ? 'Capture again' : 'New capture'}
          </button>
        </div>
      </header>

      <main className="capture-stage">
        {capture && previewUrl ? (
          <figure>
            <img src={previewUrl} alt="Latest screen capture preview" />
            <figcaption>
              <span>
                <strong>
                  {capture.width} × {capture.height}
                </strong>
                <small>PNG · {formatBytes(capture.blob.size)}</small>
              </span>
              {savedName ? (
                <button
                  type="button"
                  onClick={() => system.openApp('files', { instanceData: { view: 'recent' } })}
                >
                  <Icon name="check" size={14} />
                  {savedName}
                </button>
              ) : null}
            </figcaption>
          </figure>
        ) : (
          <section className="capture-welcome">
            <span className="capture-welcome__mark">
              <Icon name="capture" size={34} />
            </span>
            <h2>Capture what you choose.</h2>
            <p>
              Your browser will ask which tab, window, or screen to share. Nimvelis takes one frame,
              stops sharing immediately, and keeps the image local.
            </p>
            <button type="button" onClick={() => void takeCapture()} disabled={capturing}>
              <Icon name="capture" size={17} />
              {capturing ? 'Waiting for permission…' : 'Choose a screen or window'}
            </button>
            <small>
              Capture requires a secure browser context and an explicit permission prompt.
            </small>
          </section>
        )}
      </main>
    </div>
  );
}

function formatBytes(value: number) {
  if (value < 1024 ** 2) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 ** 2).toFixed(1)} MB`;
}
