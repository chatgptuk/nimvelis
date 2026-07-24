import { CalculatorApp } from '../../apps/calculator/CalculatorApp';
import { BrowserApp } from '../../apps/browser/BrowserApp';
import { CaptureApp } from '../../apps/capture/CaptureApp';
import { CalendarApp } from '../../apps/calendar/CalendarApp';
import { ClockApp } from '../../apps/clock/ClockApp';
import { ConnectionsApp } from '../../apps/connections/ConnectionsApp';
import { FilesApp } from '../../apps/files/FilesApp';
import { LumaApp } from '../../apps/luma/LumaApp';
import { MemoApp } from '../../apps/memo/MemoApp';
import { PulseApp } from '../../apps/pulse/PulseApp';
import { SettingsApp } from '../../apps/settings/SettingsApp';
import { TasksApp } from '../../apps/tasks/TasksApp';
import { StashApp } from '../../apps/stash/StashApp';
import { TerminalApp } from '../../apps/terminal/TerminalApp';
import { TextApp } from '../../apps/text/TextApp';
import { VelaApp } from '../../apps/vela/VelaApp';
import { ViewApp } from '../../apps/view/ViewApp';
import type { AppManifest } from './types';

const manifests = [
  {
    id: 'files',
    name: 'Files',
    description: 'Organize documents stored privately on this device.',
    icon: 'files',
    component: FilesApp,
    defaultWindow: {
      width: 850,
      height: 560,
      minWidth: 580,
      minHeight: 380,
    },
    permissions: ['files:read', 'files:write', 'window:open'],
    allowMultipleInstances: true,
  },
  {
    id: 'browser',
    name: 'Browser',
    description: 'Browse the web in a restricted, local-first system window.',
    icon: 'browser',
    component: BrowserApp,
    defaultWindow: {
      width: 940,
      height: 620,
      minWidth: 560,
      minHeight: 380,
    },
    permissions: ['network:access'],
    allowMultipleInstances: true,
  },
  {
    id: 'text',
    name: 'Text',
    description: 'A focused local editor with automatic saving.',
    icon: 'text',
    component: TextApp,
    defaultWindow: {
      width: 720,
      height: 540,
      minWidth: 420,
      minHeight: 320,
    },
    permissions: ['files:read', 'files:write'],
    fileAssociations: ['text/*', 'application/json', 'application/xml'],
    allowMultipleInstances: true,
  },
  {
    id: 'view',
    name: 'View',
    description: 'Preview images, PDFs, audio, and video locally.',
    icon: 'view',
    component: ViewApp,
    defaultWindow: {
      width: 780,
      height: 580,
      minWidth: 440,
      minHeight: 340,
    },
    permissions: ['files:read'],
    fileAssociations: ['image/*', 'application/pdf', 'audio/*', 'video/*'],
    allowMultipleInstances: true,
  },
  {
    id: 'tasks',
    name: 'Tasks',
    description: 'Plan and complete local tasks with dates and priorities.',
    icon: 'tasks',
    component: TasksApp,
    defaultWindow: {
      width: 760,
      height: 560,
      minWidth: 520,
      minHeight: 380,
    },
    allowMultipleInstances: false,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'A private local calendar connected to your task agenda.',
    icon: 'calendar',
    component: CalendarApp,
    defaultWindow: {
      width: 860,
      height: 610,
      minWidth: 620,
      minHeight: 440,
    },
    allowMultipleInstances: false,
  },
  {
    id: 'clock',
    name: 'Clock',
    description: 'World clocks, a focus timer, and a precise stopwatch.',
    icon: 'clock',
    component: ClockApp,
    defaultWindow: {
      width: 700,
      height: 540,
      minWidth: 480,
      minHeight: 380,
    },
    allowMultipleInstances: false,
  },
  {
    id: 'connections',
    name: 'Connections',
    description: 'Inspect network quality and connect approved Bluetooth devices.',
    icon: 'connections',
    component: ConnectionsApp,
    defaultWindow: {
      width: 760,
      height: 620,
      minWidth: 520,
      minHeight: 430,
    },
    permissions: ['network:access', 'bluetooth:request'],
    allowMultipleInstances: false,
  },
  {
    id: 'pulse',
    name: 'Pulse',
    description: 'Inspect and manage Nimvelis windows and browser runtime health.',
    icon: 'pulse',
    component: PulseApp,
    defaultWindow: {
      width: 860,
      height: 610,
      minWidth: 650,
      minHeight: 430,
    },
    permissions: ['window:read', 'window:write', 'storage:read'],
    allowMultipleInstances: false,
  },
  {
    id: 'stash',
    name: 'Stash',
    description: 'Keep searchable text and image clipboard history on this device.',
    icon: 'stash',
    component: StashApp,
    defaultWindow: {
      width: 800,
      height: 560,
      minWidth: 570,
      minHeight: 380,
    },
    permissions: ['clipboard:read', 'clipboard:write', 'storage:read'],
    allowMultipleInstances: false,
  },
  {
    id: 'capture',
    name: 'Capture',
    description: 'Capture a chosen screen surface and save it to local Files.',
    icon: 'capture',
    component: CaptureApp,
    defaultWindow: {
      width: 800,
      height: 570,
      minWidth: 540,
      minHeight: 390,
    },
    permissions: ['display:capture', 'clipboard:write', 'files:write', 'window:open'],
    allowMultipleInstances: false,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'A browser-local shell for Nimvelis apps and virtual files.',
    icon: 'terminal',
    component: TerminalApp,
    defaultWindow: {
      width: 760,
      height: 520,
      minWidth: 430,
      minHeight: 320,
    },
    permissions: ['files:read', 'files:write', 'window:open', 'window:write'],
    allowMultipleInstances: true,
  },
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'A calm, capable everyday calculator.',
    icon: 'calculator',
    component: CalculatorApp,
    defaultWindow: {
      width: 326,
      height: 468,
      minWidth: 300,
      minHeight: 420,
    },
    allowMultipleInstances: true,
  },
  {
    id: 'luma',
    name: 'Luma',
    description: 'An original built-in constellation game for quiet breaks.',
    icon: 'luma',
    component: LumaApp,
    defaultWindow: {
      width: 720,
      height: 580,
      minWidth: 430,
      minHeight: 420,
    },
    allowMultipleInstances: false,
  },
  {
    id: 'memo',
    name: 'Memo',
    description: 'A local space for notes and passing thoughts.',
    icon: 'memo',
    component: MemoApp,
    defaultWindow: {
      width: 650,
      height: 500,
      minWidth: 390,
      minHeight: 300,
    },
    permissions: ['files:read', 'files:write', 'window:open', 'window:write'],
    allowMultipleInstances: true,
  },
  {
    id: 'vela',
    name: 'Vela',
    description: 'A private-by-design text and image assistant powered by Workers AI.',
    icon: 'vela',
    component: VelaApp,
    defaultWindow: {
      width: 760,
      height: 620,
      minWidth: 430,
      minHeight: 420,
    },
    permissions: ['ai:generate'],
    allowMultipleInstances: false,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Personalize your Nimvelis space.',
    icon: 'settings',
    component: SettingsApp,
    defaultWindow: {
      width: 820,
      height: 610,
      minWidth: 590,
      minHeight: 440,
    },
    permissions: ['appearance:write'],
    allowMultipleInstances: false,
  },
] as const satisfies readonly AppManifest[];

const manifestMap = new Map<string, AppManifest>(
  manifests.map((manifest) => [manifest.id, manifest]),
);

export function listAppManifests(): readonly AppManifest[] {
  return manifests;
}

export function getAppManifest(appId: string): AppManifest | undefined {
  return manifestMap.get(appId);
}

export function hasApp(value: unknown): value is string {
  return typeof value === 'string' && manifestMap.has(value);
}
