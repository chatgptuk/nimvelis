import { useEffect, useState } from 'react';
import { AppIcon, Icon } from '../../design/Icon';
import type { VfsNode } from '../../kernel/vfs';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './view.css';

export function ViewApp({ system, window }: SystemAppProps) {
  const instanceData = readInstanceData(window.instanceData);
  const fileId = typeof instanceData.fileId === 'string' ? instanceData.fileId : null;
  const [node, setNode] = useState<VfsNode | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(Boolean(fileId));

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    const load = async () => {
      if (!fileId) return;
      await system.files.ready();
      const [nextNode, blob] = await Promise.all([
        system.files.get(fileId),
        system.files.readFile(fileId),
      ]);
      if (!active) return;
      if (!nextNode || !blob) {
        setLoading(false);
        system.notify('This file could not be opened.', 'error');
        return;
      }
      objectUrl = URL.createObjectURL(blob);
      setNode(nextNode);
      setUrl(objectUrl);
      setLoading(false);
      system.setWindowTitle(window.id, nextNode.name);
    };

    void load();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId, system, window.id]);

  const download = () => {
    if (!url || !node) return;
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = node.name;
    anchor.click();
  };

  const mime = node?.mimeType ?? '';
  const renderContent = () => {
    if (loading)
      return (
        <div className="view-message">
          <span className="view-spinner" />
          Opening file…
        </div>
      );
    if (!node || !url) {
      return (
        <div className="view-welcome">
          <AppIcon name="view" size={72} />
          <strong>View</strong>
          <span>Open an image, PDF, audio, or video file from Files.</span>
          <button onClick={() => system.openApp('files')}>Open Files</button>
        </div>
      );
    }
    if (mime.startsWith('image/')) {
      return (
        <div className="view-image-stage">
          <img src={url} alt={node.name} style={{ width: `${zoom}%` }} />
        </div>
      );
    }
    if (mime === 'application/pdf') {
      return <iframe className="view-pdf" src={url} title={node.name} />;
    }
    if (mime.startsWith('audio/')) {
      return (
        <div className="view-media">
          <AppIcon name="view" size={72} />
          <strong>{node.name}</strong>
          <audio src={url} controls />
        </div>
      );
    }
    if (mime.startsWith('video/')) {
      return <video className="view-video" src={url} controls />;
    }
    return (
      <div className="view-welcome">
        <Icon name="file" size={48} />
        <strong>No preview available</strong>
        <span>{mime || 'Unknown file type'}</span>
        <button onClick={download}>Download file</button>
      </div>
    );
  };

  return (
    <div className="view-app">
      <header className="view-toolbar">
        <div>
          <strong>{node?.name ?? 'View'}</strong>
          {node ? <span>{node.mimeType ?? 'File'}</span> : null}
        </div>
        {mime.startsWith('image/') ? (
          <label>
            <span>Zoom</span>
            <input
              type="range"
              min="25"
              max="200"
              step="5"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <output>{zoom}%</output>
          </label>
        ) : null}
        <button onClick={download} disabled={!url}>
          <Icon name="download" size={16} />
          Export
        </button>
      </header>
      <main>{renderContent()}</main>
      <footer>
        <span>{node ? `${Math.max(1, Math.round(node.size / 1024))} KB` : 'Local preview'}</span>
        <span>Nothing is uploaded</span>
      </footer>
    </div>
  );
}

function readInstanceData(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}
