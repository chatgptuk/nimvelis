import { describe, expect, it, vi } from 'vitest';
import {
  completionCandidates,
  executeTerminalCommand,
  resolvePath,
  tokenizeCommandLine,
  type TerminalCommandEnvironment,
} from '../src/apps/terminal/command-engine';
import { MemoryVirtualFileSystem, ROOT_DIRECTORY_ID } from '../src/kernel/vfs';

function createEnvironment(files = new MemoryVirtualFileSystem(false)): TerminalCommandEnvironment {
  return {
    files,
    cwdId: ROOT_DIRECTORY_ID,
    apps: [
      { id: 'files', name: 'Files', description: 'Local files' },
      { id: 'terminal', name: 'Terminal', description: 'Local shell' },
    ],
    history: [],
    timeZone: 'UTC',
    online: true,
    networkType: 'wifi',
    openApp: vi.fn(() => 'window-id'),
    openFile: vi.fn(() => 'window-id'),
    close: vi.fn(),
    setAppearance: vi.fn(),
    setTimeZone: vi.fn(),
    now: () => new Date('2026-07-24T12:00:00.000Z'),
  };
}

describe('Terminal command engine', () => {
  it('tokenizes quoted and escaped command arguments', () => {
    expect(tokenizeCommandLine('write "Project Notes.txt" "hello local world"')).toEqual([
      'write',
      'Project Notes.txt',
      'hello local world',
    ]);
    expect(tokenizeCommandLine('echo one\\ two')).toEqual(['echo', 'one two']);
    expect(() => tokenizeCommandLine('echo "unfinished')).toThrow('Unclosed quote');
  });

  it('navigates local folders and resolves relative paths', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const folder = await files.mkdir(ROOT_DIRECTORY_ID, 'Projects');
    await files.writeFile({
      parentId: folder.id,
      name: 'readme.txt',
      data: new Blob(['local shell']),
    });
    const environment = createEnvironment(files);

    const changeDirectory = await executeTerminalCommand('cd Projects', environment);
    expect(changeDirectory.cwd).toMatchObject({ id: folder.id, path: '/Projects' });

    environment.cwdId = folder.id;
    const listing = await executeTerminalCommand('ls', environment);
    expect(listing.lines.map((line) => line.text)).toEqual(['readme.txt']);
    await expect(resolvePath(files, folder.id, '../Projects/readme.txt')).resolves.toMatchObject({
      path: '/Projects/readme.txt',
    });
  });

  it('creates, writes, appends, reads, and trashes virtual files', async () => {
    const files = new MemoryVirtualFileSystem(false);
    const environment = createEnvironment(files);

    const folderResult = await executeTerminalCommand('mkdir "CLI Notes"', environment);
    expect(folderResult.lines[0]).toMatchObject({ text: 'Created /CLI Notes/', tone: 'success' });
    const folder = (await files.list(ROOT_DIRECTORY_ID))[0];
    if (!folder) throw new Error('Expected CLI Notes folder');
    environment.cwdId = folder.id;

    await executeTerminalCommand('write plan.txt "Ship local shell"', environment);
    await executeTerminalCommand('append plan.txt "Keep files private"', environment);
    const readResult = await executeTerminalCommand('cat plan.txt', environment);
    expect(readResult.lines.map((line) => line.text)).toEqual([
      'Ship local shell',
      'Keep files private',
    ]);

    const removeResult = await executeTerminalCommand('rm plan.txt', environment);
    expect(removeResult.lines[0]?.text).toContain('to Trash');
    expect(await files.list(folder.id)).toEqual([]);
    expect(await files.listTrash()).toHaveLength(1);
  });

  it('opens installed apps and rejects host shell commands honestly', async () => {
    const environment = createEnvironment();

    const openResult = await executeTerminalCommand('open files', environment);
    expect(environment.openApp).toHaveBeenCalledWith('files');
    expect(openResult.lines[0]).toMatchObject({ text: 'Opened Files.', tone: 'success' });

    const blocked = await executeTerminalCommand('sudo npm install', environment);
    expect(blocked.lines[0]).toMatchObject({ tone: 'error' });
    expect(blocked.lines[0]?.text).toContain('browser sandbox');
  });

  it('offers command, app, and local path completion candidates', async () => {
    const files = new MemoryVirtualFileSystem(false);
    await files.mkdir(ROOT_DIRECTORY_ID, 'Documents');
    const environment = createEnvironment(files);

    await expect(completionCandidates('neof', environment)).resolves.toEqual(['neofetch']);
    await expect(completionCandidates('open ter', environment)).resolves.toEqual(['terminal']);
    await expect(completionCandidates('cd Doc', environment)).resolves.toEqual(['Documents/']);
  });
});
