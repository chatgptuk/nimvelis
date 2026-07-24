import { CalculatorApp } from '../../apps/calculator/CalculatorApp';
import { MemoApp } from '../../apps/memo/MemoApp';
import { SettingsApp } from '../../apps/settings/SettingsApp';
import type { AppManifest } from './types';

const manifests = [
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
    id: 'settings',
    name: 'Settings',
    description: 'Personalize your Nimvelis space.',
    icon: 'settings',
    component: SettingsApp,
    defaultWindow: {
      width: 780,
      height: 570,
      minWidth: 560,
      minHeight: 410,
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
