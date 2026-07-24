import {
  ROOT_DIRECTORY_ID,
  type VfsNode,
  type VirtualFileSystem,
  type WriteFileInput,
} from './types';

const MAX_NAME_LENGTH = 120;
const TEXT_SEARCH_LIMIT = 1_000_000;

export class MemoryVirtualFileSystem implements VirtualFileSystem {
  protected readonly nodes = new Map<string, VfsNode>();
  protected readonly contents = new Map<string, Blob>();
  private readonly listeners = new Set<() => void>();

  constructor(seed = true) {
    if (seed) this.seed();
  }

  async ready() {}

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async list(parentId: string) {
    await this.ready();
    return sortNodes(
      [...this.nodes.values()].filter(
        (node) => node.parentId === parentId && node.trashedAt === undefined,
      ),
    );
  }

  async listTrash() {
    await this.ready();
    const all = [...this.nodes.values()];
    const byId = new Map(all.map((node) => [node.id, node]));
    return sortNodes(
      all.filter((node) => {
        if (node.trashedAt === undefined) return false;
        const parent = byId.get(node.parentId);
        return !parent || parent.trashedAt === undefined;
      }),
    );
  }

  async get(id: string) {
    await this.ready();
    const node = this.nodes.get(id);
    return node ? { ...node } : undefined;
  }

  async readFile(id: string) {
    await this.ready();
    const node = this.nodes.get(id);
    const content = this.contents.get(id);
    if (!node || node.kind !== 'file' || !content) {
      throw new Error('File is not available.');
    }
    return content;
  }

  async writeFile(input: WriteFileInput) {
    await this.ready();
    this.assertDirectory(input.parentId);
    const now = Date.now();
    const current = input.id ? this.nodes.get(input.id) : undefined;
    if (current && current.kind !== 'file') throw new Error('A directory cannot be overwritten.');

    const parentId = current?.parentId ?? input.parentId;
    const requestedName = sanitizeName(input.name);
    const name = current
      ? this.assertAvailableName(parentId, requestedName, current.id)
      : this.createAvailableName(parentId, requestedName);
    const id = current?.id ?? createNodeId('file');
    const node: VfsNode = {
      id,
      parentId,
      name,
      kind: 'file',
      mimeType: input.mimeType || input.data.type || inferMimeType(name),
      size: input.data.size,
      createdAt: current?.createdAt ?? now,
      updatedAt: now,
    };

    this.nodes.set(id, node);
    this.contents.set(id, input.data);
    await this.commit();
    return { ...node };
  }

  async mkdir(parentId: string, requestedName: string) {
    await this.ready();
    this.assertDirectory(parentId);
    const now = Date.now();
    const node: VfsNode = {
      id: createNodeId('directory'),
      parentId,
      name: this.createAvailableName(parentId, sanitizeName(requestedName)),
      kind: 'directory',
      mimeType: 'inode/directory',
      size: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.nodes.set(node.id, node);
    await this.commit();
    return { ...node };
  }

  async rename(id: string, requestedName: string) {
    await this.ready();
    const current = this.nodes.get(id);
    if (!current) throw new Error('Item no longer exists.');
    const node: VfsNode = {
      ...current,
      name: this.assertAvailableName(current.parentId, sanitizeName(requestedName), id),
      updatedAt: Date.now(),
    };
    this.nodes.set(id, node);
    await this.commit();
    return { ...node };
  }

  async move(id: string, parentId: string) {
    await this.ready();
    this.assertDirectory(parentId);
    const current = this.nodes.get(id);
    if (!current || current.trashedAt !== undefined) throw new Error('Item no longer exists.');
    if (id === parentId || this.collectTree(id).includes(parentId)) {
      throw new Error('A folder cannot be moved inside itself.');
    }
    const node: VfsNode = {
      ...current,
      parentId,
      name: this.createAvailableName(parentId, current.name),
      updatedAt: Date.now(),
    };
    this.nodes.set(id, node);
    await this.commit();
    return { ...node };
  }

  async copy(id: string, parentId: string) {
    await this.ready();
    this.assertDirectory(parentId);
    const source = this.nodes.get(id);
    if (!source || source.trashedAt !== undefined) throw new Error('Item no longer exists.');

    const duplicate = async (node: VfsNode, destinationId: string, isRoot: boolean) => {
      const now = Date.now();
      const nextId = createNodeId(node.kind);
      const copied: VfsNode = {
        ...node,
        id: nextId,
        parentId: destinationId,
        name: isRoot
          ? this.createAvailableName(destinationId, node.name)
          : this.createAvailableName(destinationId, node.name),
        createdAt: now,
        updatedAt: now,
        favorite: false,
        lastOpenedAt: undefined,
      };
      delete copied.trashedAt;
      this.nodes.set(nextId, copied);
      if (node.kind === 'file') {
        const content = this.contents.get(node.id);
        if (content) this.contents.set(nextId, content.slice(0, content.size, content.type));
      } else {
        const children = [...this.nodes.values()].filter(
          (candidate) => candidate.parentId === node.id && candidate.id !== nextId,
        );
        for (const child of children) await duplicate(child, nextId, false);
      }
      return copied;
    };

    const copied = await duplicate(source, parentId, true);
    await this.commit();
    return { ...copied };
  }

  async setFavorite(id: string, favorite: boolean) {
    await this.ready();
    const node = this.nodes.get(id);
    if (!node) return;
    this.nodes.set(id, { ...node, favorite });
    await this.commit();
  }

  async touch(id: string) {
    await this.ready();
    const node = this.nodes.get(id);
    if (!node) return;
    this.nodes.set(id, { ...node, lastOpenedAt: Date.now() });
    await this.commit();
  }

  async listFavorites() {
    await this.ready();
    return sortNodes(
      [...this.nodes.values()].filter(
        (node) => node.trashedAt === undefined && node.favorite === true,
      ),
    );
  }

  async listRecent(limit = 30) {
    await this.ready();
    return [...this.nodes.values()]
      .filter((node) => node.trashedAt === undefined)
      .map((node) => ({ ...node }))
      .sort(
        (left, right) =>
          Number(Boolean(right.lastOpenedAt)) - Number(Boolean(left.lastOpenedAt)) ||
          (right.lastOpenedAt ?? right.updatedAt) - (left.lastOpenedAt ?? left.updatedAt),
      )
      .slice(0, Math.max(1, limit));
  }

  async listDirectories() {
    await this.ready();
    return sortNodes(
      [...this.nodes.values()].filter(
        (node) => node.kind === 'directory' && node.trashedAt === undefined,
      ),
    );
  }

  async trash(id: string) {
    await this.ready();
    if (!this.nodes.has(id)) return;
    const trashedAt = Date.now();
    for (const nodeId of this.collectTree(id)) {
      const node = this.nodes.get(nodeId);
      if (node) this.nodes.set(nodeId, { ...node, trashedAt, updatedAt: trashedAt });
    }
    await this.commit();
  }

  async restore(id: string) {
    await this.ready();
    if (!this.nodes.has(id)) return;
    const now = Date.now();
    for (const nodeId of this.collectTree(id)) {
      const node = this.nodes.get(nodeId);
      if (!node) continue;
      const restored = { ...node };
      delete restored.trashedAt;
      this.nodes.set(nodeId, { ...restored, updatedAt: now });
    }
    await this.commit();
  }

  async deletePermanently(id: string) {
    await this.ready();
    for (const nodeId of this.collectTree(id)) {
      this.nodes.delete(nodeId);
      this.contents.delete(nodeId);
    }
    await this.commit();
  }

  async emptyTrash() {
    await this.ready();
    for (const node of [...this.nodes.values()]) {
      if (node.trashedAt === undefined) continue;
      this.nodes.delete(node.id);
      this.contents.delete(node.id);
    }
    await this.commit();
  }

  async search(rawQuery: string) {
    await this.ready();
    const query = rawQuery.trim().toLocaleLowerCase();
    if (!query) return [];

    const matches: VfsNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.trashedAt !== undefined) continue;
      if (node.name.toLocaleLowerCase().includes(query)) {
        matches.push({ ...node });
        continue;
      }
      if (node.kind === 'file' && node.size <= TEXT_SEARCH_LIMIT && isTextMimeType(node.mimeType)) {
        const content = this.contents.get(node.id);
        if ((await content?.text())?.toLocaleLowerCase().includes(query)) {
          matches.push({ ...node });
        }
      }
    }
    return sortNodes(matches);
  }

  protected seed() {
    const now = Date.now();
    const documents: VfsNode = {
      id: 'seed-documents',
      parentId: ROOT_DIRECTORY_ID,
      name: 'Documents',
      kind: 'directory',
      mimeType: 'inode/directory',
      size: 0,
      createdAt: now - 20_000,
      updatedAt: now - 10_000,
    };
    const welcomeContent = new Blob(
      [
        'Welcome to Nimvelis Files.\n\nThis local workspace is stored in your browser. Create folders, edit text files, import images or PDFs, and find everything with Search.\n',
      ],
      { type: 'text/plain' },
    );
    const welcome: VfsNode = {
      id: 'seed-welcome',
      parentId: documents.id,
      name: 'Welcome to Nimvelis.txt',
      kind: 'file',
      mimeType: 'text/plain',
      size: welcomeContent.size,
      createdAt: now - 18_000,
      updatedAt: now - 8_000,
    };
    const artworkContent = new Blob([createSeedArtwork()], { type: 'image/svg+xml' });
    const artwork: VfsNode = {
      id: 'seed-artwork',
      parentId: ROOT_DIRECTORY_ID,
      name: 'Aurora Shapes.svg',
      kind: 'file',
      mimeType: 'image/svg+xml',
      size: artworkContent.size,
      createdAt: now - 16_000,
      updatedAt: now - 6_000,
    };

    this.nodes.set(documents.id, documents);
    this.nodes.set(welcome.id, welcome);
    this.nodes.set(artwork.id, artwork);
    this.contents.set(welcome.id, welcomeContent);
    this.contents.set(artwork.id, artworkContent);
  }

  protected async commit() {
    for (const listener of this.listeners) listener();
  }

  private assertDirectory(id: string) {
    if (id === ROOT_DIRECTORY_ID) return;
    const node = this.nodes.get(id);
    if (!node || node.kind !== 'directory' || node.trashedAt !== undefined) {
      throw new Error('Destination directory is not available.');
    }
  }

  private createAvailableName(parentId: string, requestedName: string) {
    if (!this.hasName(parentId, requestedName)) return requestedName;
    const dotIndex = requestedName.lastIndexOf('.');
    const hasExtension = dotIndex > 0;
    const base = hasExtension ? requestedName.slice(0, dotIndex) : requestedName;
    const extension = hasExtension ? requestedName.slice(dotIndex) : '';
    let index = 2;
    while (this.hasName(parentId, `${base} ${index}${extension}`)) index += 1;
    return `${base} ${index}${extension}`;
  }

  private assertAvailableName(parentId: string, name: string, exceptId: string) {
    if (this.hasName(parentId, name, exceptId)) {
      throw new Error('An item with this name already exists.');
    }
    return name;
  }

  private hasName(parentId: string, name: string, exceptId?: string) {
    const normalized = name.toLocaleLowerCase();
    return [...this.nodes.values()].some(
      (node) =>
        node.id !== exceptId &&
        node.parentId === parentId &&
        node.trashedAt === undefined &&
        node.name.toLocaleLowerCase() === normalized,
    );
  }

  private collectTree(rootId: string) {
    const ids = [rootId];
    for (let index = 0; index < ids.length; index += 1) {
      const parentId = ids[index];
      for (const node of this.nodes.values()) {
        if (node.parentId === parentId) ids.push(node.id);
      }
    }
    return ids;
  }
}

function sortNodes(nodes: VfsNode[]) {
  return nodes
    .map((node) => ({ ...node }))
    .sort(
      (left, right) =>
        Number(right.kind === 'directory') - Number(left.kind === 'directory') ||
        left.name.localeCompare(right.name),
    );
}

function sanitizeName(value: string) {
  const name = value.replaceAll('/', '-').replaceAll('\0', '').trim().slice(0, MAX_NAME_LENGTH);
  if (!name || name === '.' || name === '..') throw new Error('Enter a valid item name.');
  return name;
}

function createNodeId(kind: VfsNode['kind']) {
  const suffix =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${kind}-${suffix}`;
}

function inferMimeType(name: string) {
  const extension = name.split('.').pop()?.toLocaleLowerCase();
  const types: Record<string, string> = {
    txt: 'text/plain',
    md: 'text/markdown',
    json: 'application/json',
    csv: 'text/csv',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/typescript',
    svg: 'image/svg+xml',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
  };
  return extension ? (types[extension] ?? 'application/octet-stream') : 'text/plain';
}

export function isTextMimeType(mimeType: string) {
  return (
    mimeType.startsWith('text/') ||
    ['application/json', 'application/xml', 'image/svg+xml'].includes(mimeType)
  );
}

function createSeedArtwork() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#111b4c"/>
      <stop offset=".5" stop-color="#6553ba"/>
      <stop offset="1" stop-color="#f08a9d"/>
    </linearGradient>
    <radialGradient id="glow">
      <stop stop-color="#90fff1" stop-opacity=".95"/>
      <stop offset="1" stop-color="#90fff1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="960" height="640" rx="48" fill="url(#sky)"/>
  <circle cx="710" cy="150" r="210" fill="url(#glow)"/>
  <path d="M90 500 310 170l170 250 120-170 270 250Z" fill="#101737" opacity=".74"/>
  <path d="m310 170 82 122-74 70-95-48Z" fill="#96f7e8" opacity=".7"/>
  <path d="M90 500c190-92 334-85 438-38 112 51 216 42 342 1v77H90Z" fill="#091127" opacity=".72"/>
  <text x="70" y="92" fill="white" font-family="system-ui,sans-serif" font-size="34" font-weight="700">NIMVELIS</text>
  <text x="72" y="126" fill="white" opacity=".68" font-family="system-ui,sans-serif" font-size="18">Original local artwork</text>
</svg>`;
}
