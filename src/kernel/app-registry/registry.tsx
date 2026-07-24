import { CalculatorApp } from '../../apps/calculator/CalculatorApp';
import { CalendarApp } from '../../apps/calendar/CalendarApp';
import { ClockApp } from '../../apps/clock/ClockApp';
import { FilesApp } from '../../apps/files/FilesApp';
import { MemoApp } from '../../apps/memo/MemoApp';
import { SettingsApp } from '../../apps/settings/SettingsApp';
import { TasksApp } from '../../apps/tasks/TasksApp';
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
    permissions: ['window:open', 'window:write'],
    allowMultipleInstances: true,
  },
  {
    id: 'vela',
    name: 'Vela',
    description: 'A private-by-design text assistant powered by Cloudflare Workers AI.',
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
