import type {
  InstalledAppSummary,
  NimvelisSystemApi,
  OpenAppOptions,
} from '../../kernel/system-api';
import {
  isTextMimeType,
  ROOT_DIRECTORY_ID,
  type VfsNode,
  type VirtualFileSystem,
} from '../../kernel/vfs';
import { isTimeZoneId, resolveTimeZone, type TimeZoneId } from '../../kernel/time';
import type { AppearanceMode } from '../../state/desktop-store';

export type TerminalLineTone = 'normal' | 'muted' | 'accent' | 'success' | 'error';

export interface TerminalOutputLine {
  text: string;
  tone?: TerminalLineTone;
}

export interface TerminalCommandResult {
  lines: TerminalOutputLine[];
  cwd?: ResolvedPath;
  clear?: boolean;
}

export interface ResolvedPath {
  id: string;
  path: string;
  node?: VfsNode;
}

export interface TerminalCommandEnvironment {
  files: VirtualFileSystem;
  cwdId: string;
  apps: InstalledAppSummary[];
  history: string[];
  timeZone: TimeZoneId;
  online: boolean;
  networkType?: string;
  openApp: (appId: string, options?: OpenAppOptions) => string | null;
  openFile: NimvelisSystemApi['openFile'];
  close: () => void;
  setAppearance: (appearance: AppearanceMode) => void;
  setTimeZone: (timeZone: TimeZoneId) => void;
  now?: () => Date;
}

interface CommandDefinition {
  usage: string;
  summary: string;
}

export const TERMINAL_COMMANDS: Record<string, CommandDefinition> = {
  help: { usage: 'help [command]', summary: 'Show commands or detailed usage.' },
  clear: { usage: 'clear', summary: 'Clear the current terminal transcript.' },
  pwd: { usage: 'pwd', summary: 'Print the current local folder.' },
  ls: { usage: 'ls [-l] [path]', summary: 'List files and folders.' },
  cd: { usage: 'cd [path]', summary: 'Change the current local folder.' },
  tree: { usage: 'tree [path]', summary: 'Show a local folder tree.' },
  cat: { usage: 'cat <file>', summary: 'Read a local text-compatible file.' },
  stat: { usage: 'stat <path>', summary: 'Show local item metadata.' },
  find: { usage: 'find <query>', summary: 'Search local file names and text.' },
  mkdir: { usage: 'mkdir <path>', summary: 'Create a local folder.' },
  touch: { usage: 'touch <file>', summary: 'Create an empty local file.' },
  write: { usage: 'write <file> <text>', summary: 'Create or replace a local text file.' },
  append: { usage: 'append <file> <text>', summary: 'Append text to a local file.' },
  rename: { usage: 'rename <path> <name>', summary: 'Rename a local item.' },
  mv: { usage: 'mv <path> <folder>', summary: 'Move a local item into a folder.' },
  cp: { usage: 'cp <path> <folder>', summary: 'Copy a local item into a folder.' },
  rm: { usage: 'rm <path>', summary: 'Move a local item to Trash.' },
  open: { usage: 'open <app|path>', summary: 'Open a system app or local item.' },
  apps: { usage: 'apps', summary: 'List installed Nimvelis apps.' },
  date: { usage: 'date', summary: 'Show the current Nimvelis date and time.' },
  timezone: { usage: 'timezone [zone|system]', summary: 'Read or set the display time zone.' },
  theme: { usage: 'theme [system|light|dark]', summary: 'Read or change appearance.' },
  network: { usage: 'network', summary: 'Show browser-exposed connection state.' },
  history: { usage: 'history', summary: 'Show recent commands in this browser.' },
  whoami: { usage: 'whoami', summary: 'Show the local session identity.' },
  uname: { usage: 'uname', summary: 'Show the Nimvelis system version.' },
  version: { usage: 'version', summary: 'Show Local Shell version information.' },
  neofetch: { usage: 'neofetch', summary: 'Show a compact local system profile.' },
  echo: { usage: 'echo [text]', summary: 'Print text to the terminal.' },
  exit: { usage: 'exit', summary: 'Close this Terminal window.' },
};

export const TERMINAL_COMMAND_NAMES = Object.keys(TERMINAL_COMMANDS);

const ALIASES: Record<string, string> = {
  cls: 'clear',
  dir: 'ls',
  type: 'cat',
  rmdir: 'rm',
};

const HOST_ONLY_COMMANDS = new Set([
  'bash',
  'brew',
  'curl',
  'git',
  'npm',
  'node',
  'ping',
  'powershell',
  'python',
  'sh',
  'ssh',
  'sudo',
  'wget',
  'zsh',
]);

const MAX_CAT_BYTES = 250_000;
const MAX_TREE_ITEMS = 180;

export async function executeTerminalCommand(
  rawCommand: string,
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  try {
    const tokens = tokenizeCommandLine(rawCommand);
    if (!tokens.length) return { lines: [] };
    const requestedCommand = tokens[0].toLocaleLowerCase();
    const command = ALIASES[requestedCommand] ?? requestedCommand;
    const args = tokens.slice(1);

    if (HOST_ONLY_COMMANDS.has(command)) {
      return error(
        `${requestedCommand}: unavailable in the browser sandbox. This shell operates only on Nimvelis apps and local virtual files.`,
      );
    }

    switch (command) {
      case 'help':
        return helpCommand(args);
      case 'clear':
        return { lines: [], clear: true };
      case 'pwd': {
        const current = await resolvePath(environment.files, environment.cwdId, '.');
        return output(current.path, 'accent');
      }
      case 'ls':
        return listCommand(args, environment);
      case 'cd':
        return changeDirectoryCommand(args, environment);
      case 'tree':
        return treeCommand(args, environment);
      case 'cat':
        return catCommand(args, environment);
      case 'stat':
        return statCommand(args, environment);
      case 'find':
        return findCommand(args, environment);
      case 'mkdir':
        return mkdirCommand(args, environment);
      case 'touch':
        return touchCommand(args, environment);
      case 'write':
        return writeCommand(args, environment, false);
      case 'append':
        return writeCommand(args, environment, true);
      case 'rename':
        return renameCommand(args, environment);
      case 'mv':
        return moveOrCopyCommand(args, environment, 'move');
      case 'cp':
        return moveOrCopyCommand(args, environment, 'copy');
      case 'rm':
        return removeCommand(args, environment);
      case 'open':
        return openCommand(args, environment);
      case 'apps':
        return {
          lines: environment.apps.map((app) => ({
            text: `${app.id.padEnd(13)} ${app.description}`,
            tone: 'normal',
          })),
        };
      case 'date': {
        const now = environment.now?.() ?? new Date();
        const timeZone = resolveTimeZone(environment.timeZone);
        return output(
          new Intl.DateTimeFormat(undefined, {
            dateStyle: 'full',
            timeStyle: 'long',
            timeZone,
          }).format(now),
          'accent',
        );
      }
      case 'timezone':
        return timeZoneCommand(args, environment);
      case 'theme':
        return themeCommand(args, environment);
      case 'network':
        return {
          lines: [
            {
              text: environment.online ? 'Status       online' : 'Status       offline',
              tone: environment.online ? 'success' : 'error',
            },
            {
              text: `Connection   ${environment.networkType || 'not exposed by this browser'}`,
              tone: 'normal',
            },
            {
              text: 'Use Connections for latency, quality, and Bluetooth details.',
              tone: 'muted',
            },
          ],
        };
      case 'history':
        return {
          lines: environment.history.length
            ? environment.history.slice(-40).map((item, index, items) => ({
                text: `${String(environment.history.length - items.length + index + 1).padStart(
                  3,
                )}  ${item}`,
                tone: 'normal',
              }))
            : [{ text: 'No command history yet.', tone: 'muted' }],
        };
      case 'whoami':
        return output('local-user', 'accent');
      case 'uname':
        return output('Nimvelis Aurora 0.7 · browser-native local workspace', 'accent');
      case 'version':
        return {
          lines: [
            { text: 'Nimvelis Local Shell 1.0', tone: 'accent' },
            { text: 'Aurora 0.7 · virtual file and system command environment', tone: 'muted' },
          ],
        };
      case 'neofetch':
        return neofetchCommand(environment);
      case 'echo':
        return output(args.join(' '));
      case 'exit':
        environment.close();
        return { lines: [] };
      default:
        return error(`Command not found: ${requestedCommand}. Type “help” to see local commands.`);
    }
  } catch (caught) {
    return error(caught instanceof Error ? caught.message : 'The command could not be completed.');
  }
}

export function tokenizeCommandLine(value: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let escaping = false;
  let started = false;

  for (const character of value.trim()) {
    if (escaping) {
      current += character;
      escaping = false;
      started = true;
      continue;
    }
    if (character === '\\' && quote !== "'") {
      escaping = true;
      started = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = null;
      else current += character;
      started = true;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      started = true;
      continue;
    }
    if (/\s/.test(character)) {
      if (started) {
        tokens.push(current);
        current = '';
        started = false;
      }
      continue;
    }
    current += character;
    started = true;
  }

  if (escaping) current += '\\';
  if (quote) throw new Error('Unclosed quote in command.');
  if (started) tokens.push(current);
  return tokens;
}

export async function resolvePath(
  files: VirtualFileSystem,
  cwdId: string,
  requestedPath: string,
): Promise<ResolvedPath> {
  await files.ready();
  const rawPath = requestedPath.trim() || '.';
  let currentId = rawPath.startsWith('/')
    ? ROOT_DIRECTORY_ID
    : await validDirectoryId(files, cwdId);
  const segments = rawPath.split('/').filter(Boolean);

  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      if (currentId === ROOT_DIRECTORY_ID) continue;
      const current = await files.get(currentId);
      currentId = current?.parentId ?? ROOT_DIRECTORY_ID;
      continue;
    }
    const children = await files.list(currentId);
    const child = children.find(
      (candidate) => candidate.name.toLocaleLowerCase() === segment.toLocaleLowerCase(),
    );
    if (!child) throw new Error(`Path not found: ${requestedPath}`);
    currentId = child.id;
  }

  const node = currentId === ROOT_DIRECTORY_ID ? undefined : await files.get(currentId);
  return { id: currentId, path: await pathForId(files, currentId), node };
}

export async function completionCandidates(
  rawCommand: string,
  environment: Pick<TerminalCommandEnvironment, 'files' | 'cwdId' | 'apps'>,
): Promise<string[]> {
  const trimmedStart = rawCommand.trimStart();
  const parts = trimmedStart.split(/\s+/);
  if (parts.length <= 1 && !trimmedStart.endsWith(' ')) {
    const prefix = parts[0]?.toLocaleLowerCase() ?? '';
    return TERMINAL_COMMAND_NAMES.filter((command) => command.startsWith(prefix));
  }

  const command = (ALIASES[parts[0]?.toLocaleLowerCase()] ?? parts[0]?.toLocaleLowerCase()) || '';
  const rawArgument = trimmedStart.endsWith(' ') ? '' : (parts.at(-1) ?? '');
  if (command === 'open') {
    const apps = environment.apps
      .map((app) => app.id)
      .filter((id) => id.startsWith(rawArgument.toLocaleLowerCase()));
    if (apps.length) return apps;
  }

  if (
    ![
      'append',
      'cat',
      'cd',
      'cp',
      'ls',
      'mkdir',
      'mv',
      'open',
      'rename',
      'rm',
      'stat',
      'touch',
      'tree',
      'write',
    ].includes(command)
  ) {
    return [];
  }

  const slashIndex = rawArgument.lastIndexOf('/');
  const directoryPart = slashIndex >= 0 ? rawArgument.slice(0, slashIndex + 1) : '';
  const namePart = slashIndex >= 0 ? rawArgument.slice(slashIndex + 1) : rawArgument;
  let directory: ResolvedPath;
  try {
    directory = await resolvePath(environment.files, environment.cwdId, directoryPart || '.');
  } catch {
    return [];
  }
  if (directory.node && directory.node.kind !== 'directory') return [];
  return (await environment.files.list(directory.id))
    .filter((node) => node.name.toLocaleLowerCase().startsWith(namePart.toLocaleLowerCase()))
    .map((node) => `${directoryPart}${node.name}${node.kind === 'directory' ? '/' : ''}`);
}

function helpCommand(args: string[]): TerminalCommandResult {
  const requested = args[0]?.toLocaleLowerCase();
  if (requested) {
    const command = ALIASES[requested] ?? requested;
    const definition = TERMINAL_COMMANDS[command];
    if (!definition) return error(`No help is available for: ${requested}`);
    return {
      lines: [
        { text: definition.usage, tone: 'accent' },
        { text: definition.summary, tone: 'normal' },
      ],
    };
  }
  return {
    lines: [
      { text: 'NIMVELIS LOCAL COMMANDS', tone: 'accent' },
      ...Object.entries(TERMINAL_COMMANDS).map(([name, definition]) => ({
        text: `${name.padEnd(10)} ${definition.summary}`,
        tone: 'normal' as const,
      })),
      {
        text: 'This is a browser-local shell. Host commands, remote shells, and OS processes are unavailable.',
        tone: 'muted',
      },
    ],
  };
}

async function listCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  const long = args.includes('-l') || args.includes('-la') || args.includes('-al');
  const pathArgument = args.find((argument) => !argument.startsWith('-')) ?? '.';
  const target = await resolvePath(environment.files, environment.cwdId, pathArgument);
  if (target.node?.kind === 'file') return output(formatListNode(target.node, long));
  const nodes = await environment.files.list(target.id);
  if (!nodes.length) return output('(empty)', 'muted');
  return {
    lines: nodes.map((node) => ({
      text: formatListNode(node, long),
      tone: node.kind === 'directory' ? 'accent' : 'normal',
    })),
  };
}

async function changeDirectoryCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  const target = await resolvePath(environment.files, environment.cwdId, args[0] ?? '/');
  if (target.node && target.node.kind !== 'directory') {
    return error(`Not a directory: ${target.path}`);
  }
  return { lines: [], cwd: target };
}

async function treeCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  const target = await resolvePath(environment.files, environment.cwdId, args[0] ?? '.');
  if (target.node?.kind === 'file') return output(target.node.name);
  const lines: TerminalOutputLine[] = [
    { text: target.path === '/' ? '/' : `${target.node?.name ?? '/'}/`, tone: 'accent' },
  ];
  let count = 0;

  const walk = async (parentId: string, prefix: string, depth: number) => {
    if (depth > 6 || count >= MAX_TREE_ITEMS) return;
    const nodes = await environment.files.list(parentId);
    for (const [index, node] of nodes.entries()) {
      if (count >= MAX_TREE_ITEMS) break;
      count += 1;
      const last = index === nodes.length - 1;
      lines.push({
        text: `${prefix}${last ? '└──' : '├──'} ${node.name}${node.kind === 'directory' ? '/' : ''}`,
        tone: node.kind === 'directory' ? 'accent' : 'normal',
      });
      if (node.kind === 'directory') {
        await walk(node.id, `${prefix}${last ? '    ' : '│   '}`, depth + 1);
      }
    }
  };

  await walk(target.id, '', 0);
  if (count >= MAX_TREE_ITEMS) {
    lines.push({ text: `…output limited to ${MAX_TREE_ITEMS} items`, tone: 'muted' });
  }
  return { lines };
}

async function catCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  if (!args[0]) return usageError('cat');
  const target = await resolvePath(environment.files, environment.cwdId, args[0]);
  if (!target.node || target.node.kind !== 'file') return error(`Not a file: ${target.path}`);
  if (target.node.size > MAX_CAT_BYTES) {
    return error(`File is too large to print (${formatBytes(target.node.size)}).`);
  }
  if (!isTextMimeType(target.node.mimeType)) {
    return error(`Cannot print binary content (${target.node.mimeType}). Use “open ${args[0]}”.`);
  }
  const content = await (await environment.files.readFile(target.node.id)).text();
  return {
    lines: content
      ? content.split(/\r?\n/).map((text) => ({ text, tone: 'normal' }))
      : [{ text: '(empty file)', tone: 'muted' }],
  };
}

async function statCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  if (!args[0]) return usageError('stat');
  const target = await resolvePath(environment.files, environment.cwdId, args[0]);
  if (!target.node) {
    return {
      lines: [
        { text: 'Path       /', tone: 'accent' },
        { text: 'Type       directory', tone: 'normal' },
        { text: 'Storage    Browser-local IndexedDB', tone: 'normal' },
      ],
    };
  }
  return {
    lines: [
      { text: `Path       ${target.path}`, tone: 'accent' },
      { text: `Type       ${target.node.kind}`, tone: 'normal' },
      { text: `MIME       ${target.node.mimeType}`, tone: 'normal' },
      { text: `Size       ${formatBytes(target.node.size)}`, tone: 'normal' },
      {
        text: `Modified   ${new Intl.DateTimeFormat(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(target.node.updatedAt)}`,
        tone: 'normal',
      },
    ],
  };
}

async function findCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  const query = args.join(' ').trim();
  if (!query) return usageError('find');
  const matches = await environment.files.search(query);
  if (!matches.length) return output(`No local files match “${query}”.`, 'muted');
  const lines: TerminalOutputLine[] = [];
  for (const node of matches.slice(0, 80)) {
    lines.push({
      text: `${await pathForId(environment.files, node.id)}${node.kind === 'directory' ? '/' : ''}`,
      tone: node.kind === 'directory' ? 'accent' : 'normal',
    });
  }
  if (matches.length > 80) {
    lines.push({ text: `…${matches.length - 80} more matches`, tone: 'muted' });
  }
  return { lines };
}

async function mkdirCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  if (!args[0]) return usageError('mkdir');
  const target = await resolveParentTarget(environment.files, environment.cwdId, args[0]);
  const node = await environment.files.mkdir(target.parent.id, target.name);
  return output(`Created ${joinDisplayPath(target.parent.path, node.name)}/`, 'success');
}

async function touchCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  if (!args[0]) return usageError('touch');
  const existing = await tryResolvePath(environment.files, environment.cwdId, args[0]);
  if (existing) {
    if (!existing.node || existing.node.kind !== 'file') return error('touch expects a file path.');
    await environment.files.touch(existing.id);
    return output(`Touched ${existing.path}`, 'success');
  }
  const target = await resolveParentTarget(environment.files, environment.cwdId, args[0]);
  const node = await environment.files.writeFile({
    parentId: target.parent.id,
    name: target.name,
    data: new Blob([]),
  });
  return output(`Created ${joinDisplayPath(target.parent.path, node.name)}`, 'success');
}

async function writeCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
  append: boolean,
): Promise<TerminalCommandResult> {
  if (!args[0] || args.length < 2) return usageError(append ? 'append' : 'write');
  const requestedPath = args[0];
  const text = args.slice(1).join(' ');
  const existing = await tryResolvePath(environment.files, environment.cwdId, requestedPath);
  if (existing?.node?.kind === 'directory') return error(`Not a file: ${existing.path}`);
  let content = text;
  if (append && existing?.node) {
    if (!isTextMimeType(existing.node.mimeType)) return error('Cannot append to a binary file.');
    const previous = await (await environment.files.readFile(existing.node.id)).text();
    content = `${previous}${previous && !previous.endsWith('\n') ? '\n' : ''}${text}`;
  }
  const target = existing
    ? null
    : await resolveParentTarget(environment.files, environment.cwdId, requestedPath);
  const node = await environment.files.writeFile({
    id: existing?.node?.id,
    parentId: existing?.node?.parentId ?? target!.parent.id,
    name: existing?.node?.name ?? target!.name,
    data: new Blob([content]),
  });
  return output(
    `${append ? 'Appended' : 'Wrote'} ${formatBytes(node.size)} to ${await pathForId(
      environment.files,
      node.id,
    )}`,
    'success',
  );
}

async function renameCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  if (!args[0] || !args[1]) return usageError('rename');
  const target = await resolvePath(environment.files, environment.cwdId, args[0]);
  if (!target.node) return error('The root directory cannot be renamed.');
  const renamed = await environment.files.rename(target.node.id, args.slice(1).join(' '));
  const result = output(`Renamed to ${renamed.name}`, 'success');
  if (renamed.id === environment.cwdId) {
    result.cwd = await resolvePath(environment.files, renamed.id, '.');
  }
  return result;
}

async function moveOrCopyCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
  operation: 'move' | 'copy',
): Promise<TerminalCommandResult> {
  if (!args[0] || !args[1]) return usageError(operation === 'move' ? 'mv' : 'cp');
  const source = await resolvePath(environment.files, environment.cwdId, args[0]);
  const destination = await resolvePath(environment.files, environment.cwdId, args[1]);
  if (!source.node) return error('The root directory cannot be moved or copied.');
  if (destination.node && destination.node.kind !== 'directory') {
    return error(`Destination is not a directory: ${destination.path}`);
  }
  const node =
    operation === 'move'
      ? await environment.files.move(source.node.id, destination.id)
      : await environment.files.copy(source.node.id, destination.id);
  const result = output(
    `${operation === 'move' ? 'Moved' : 'Copied'} to ${joinDisplayPath(
      destination.path,
      node.name,
    )}`,
    'success',
  );
  if (operation === 'move' && node.id === environment.cwdId) {
    result.cwd = await resolvePath(environment.files, node.id, '.');
  }
  return result;
}

async function removeCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  if (!args[0]) return usageError('rm');
  const target = await resolvePath(environment.files, environment.cwdId, args[0]);
  if (!target.node) return error('The root directory cannot be removed.');
  if (target.id === environment.cwdId) {
    return error('The current folder cannot be moved to Trash. Change folders first.');
  }
  await environment.files.trash(target.node.id);
  return output(`Moved ${target.path} to Trash.`, 'success');
}

async function openCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): Promise<TerminalCommandResult> {
  const requested = args.join(' ').trim();
  if (!requested) return usageError('open');
  const normalized = requested.toLocaleLowerCase();
  const app = environment.apps.find(
    (candidate) =>
      candidate.id.toLocaleLowerCase() === normalized ||
      candidate.name.toLocaleLowerCase() === normalized,
  );
  if (app) {
    environment.openApp(app.id);
    return output(`Opened ${app.name}.`, 'success');
  }
  const target = await resolvePath(environment.files, environment.cwdId, requested);
  if (!target.node || target.node.kind === 'directory') {
    environment.openApp('files', { instanceData: { folderId: target.id } });
    return output(`Opened ${target.path} in Files.`, 'success');
  }
  environment.openFile(target.node);
  return output(`Opened ${target.node.name}.`, 'success');
}

function timeZoneCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): TerminalCommandResult {
  if (!args[0]) return output(environment.timeZone, 'accent');
  const requested = args[0];
  if (!isTimeZoneId(requested)) {
    return error(
      `Unsupported time zone: ${requested}. Use “system” or a zone shown in Date & Time settings.`,
    );
  }
  environment.setTimeZone(requested);
  return output(`Display time zone set to ${requested}.`, 'success');
}

function themeCommand(
  args: string[],
  environment: TerminalCommandEnvironment,
): TerminalCommandResult {
  if (!args[0]) return output('Use theme system, theme light, or theme dark.', 'muted');
  if (!['system', 'light', 'dark'].includes(args[0])) return usageError('theme');
  environment.setAppearance(args[0] as AppearanceMode);
  return output(`Appearance set to ${args[0]}.`, 'success');
}

function neofetchCommand(environment: TerminalCommandEnvironment): TerminalCommandResult {
  return {
    lines: [
      { text: '        ╭──────────────╮', tone: 'accent' },
      { text: '      ╱  N I M V E L I S ╲', tone: 'accent' },
      { text: '      ╲    A U R O R A   ╱', tone: 'accent' },
      { text: '        ╰──────────────╯', tone: 'accent' },
      { text: 'OS        Aurora 0.7', tone: 'normal' },
      { text: 'Shell     Local Shell 1.0', tone: 'normal' },
      { text: `Apps      ${environment.apps.length} installed`, tone: 'normal' },
      { text: `Zone      ${environment.timeZone}`, tone: 'normal' },
      { text: `Network   ${environment.online ? 'online' : 'offline'}`, tone: 'normal' },
      { text: 'Storage   Browser-local IndexedDB', tone: 'normal' },
      { text: 'Boundary  No host OS or remote shell access', tone: 'muted' },
    ],
  };
}

async function resolveParentTarget(
  files: VirtualFileSystem,
  cwdId: string,
  rawPath: string,
): Promise<{ parent: ResolvedPath; name: string }> {
  const path = rawPath.replace(/\/+$/, '');
  const lastSlash = path.lastIndexOf('/');
  const name = path.slice(lastSlash + 1).trim();
  if (!name || name === '.' || name === '..') throw new Error('Enter a valid item name.');
  const parentPath = lastSlash < 0 ? '.' : path.slice(0, lastSlash) || '/';
  const parent = await resolvePath(files, cwdId, parentPath);
  if (parent.node && parent.node.kind !== 'directory') {
    throw new Error(`Not a directory: ${parent.path}`);
  }
  return { parent, name };
}

async function tryResolvePath(
  files: VirtualFileSystem,
  cwdId: string,
  rawPath: string,
): Promise<ResolvedPath | null> {
  try {
    return await resolvePath(files, cwdId, rawPath);
  } catch {
    return null;
  }
}

async function validDirectoryId(files: VirtualFileSystem, id: string) {
  if (id === ROOT_DIRECTORY_ID) return id;
  const node = await files.get(id);
  return node?.kind === 'directory' && node.trashedAt === undefined ? id : ROOT_DIRECTORY_ID;
}

async function pathForId(files: VirtualFileSystem, id: string) {
  if (id === ROOT_DIRECTORY_ID) return '/';
  const names: string[] = [];
  let currentId = id;
  for (let depth = 0; depth < 64 && currentId !== ROOT_DIRECTORY_ID; depth += 1) {
    const node = await files.get(currentId);
    if (!node) break;
    names.unshift(node.name);
    currentId = node.parentId;
  }
  return `/${names.join('/')}`;
}

function formatListNode(node: VfsNode, long: boolean) {
  const name = `${node.name}${node.kind === 'directory' ? '/' : ''}`;
  if (!long) return name;
  const kind = node.kind === 'directory' ? 'd' : '-';
  const size = formatBytes(node.size).padStart(9);
  const modified = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(node.updatedAt);
  return `${kind}rw-local  ${size}  ${modified}  ${name}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function joinDisplayPath(parent: string, name: string) {
  return parent === '/' ? `/${name}` : `${parent}/${name}`;
}

function output(text: string, tone: TerminalLineTone = 'normal'): TerminalCommandResult {
  return { lines: [{ text, tone }] };
}

function error(text: string): TerminalCommandResult {
  return output(text, 'error');
}

function usageError(command: keyof typeof TERMINAL_COMMANDS): TerminalCommandResult {
  return error(`Usage: ${TERMINAL_COMMANDS[command].usage}`);
}
