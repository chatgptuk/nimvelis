import type { ComponentType } from 'react';
import type { IconName } from '../../design/Icon';
import type { NimvelisSystemApi } from '../system-api';
import type { WindowInstance } from '../window-manager/types';

export type AppPermission =
  | 'ai:generate'
  | 'appearance:write'
  | 'bluetooth:request'
  | 'clipboard:read'
  | 'clipboard:write'
  | 'display:capture'
  | 'files:read'
  | 'files:write'
  | 'network:access'
  | 'notifications:read'
  | 'storage:read'
  | 'window:open'
  | 'window:read'
  | 'window:write';

export interface SystemAppProps {
  window: WindowInstance;
  system: NimvelisSystemApi;
}

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  component: ComponentType<SystemAppProps>;
  defaultWindow: {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
  };
  permissions?: AppPermission[];
  fileAssociations?: string[];
  allowMultipleInstances?: boolean;
}
