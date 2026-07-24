import { useEffect, useState } from 'react';
import { Icon } from '../../design/Icon';
import type { SystemAppProps } from '../../kernel/app-registry/types';
import './connections.css';

interface NetworkInformationLike extends EventTarget {
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface BluetoothRemoteGattServerLike {
  connected: boolean;
  connect: () => Promise<BluetoothRemoteGattServerLike>;
  disconnect: () => void;
}

interface BluetoothDeviceLike extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGattServerLike;
}

interface BluetoothLike {
  getAvailability?: () => Promise<boolean>;
  requestDevice: (options: {
    acceptAllDevices: boolean;
    optionalServices?: string[];
  }) => Promise<BluetoothDeviceLike>;
}

type DeviceNavigator = Navigator & {
  connection?: NetworkInformationLike;
  mozConnection?: NetworkInformationLike;
  webkitConnection?: NetworkInformationLike;
  bluetooth?: BluetoothLike;
};

interface NetworkSnapshot {
  online: boolean;
  type?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData: boolean;
}

type BluetoothStatus = 'idle' | 'choosing' | 'connecting' | 'connected' | 'error';

export function ConnectionsApp({ system }: SystemAppProps) {
  const bluetooth = (navigator as DeviceNavigator).bluetooth;
  const [network, setNetwork] = useState(readNetworkSnapshot);
  const [latency, setLatency] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [bluetoothAvailable, setBluetoothAvailable] = useState<boolean | null>(() =>
    bluetooth ? (bluetooth.getAvailability ? null : true) : false,
  );
  const [bluetoothStatus, setBluetoothStatus] = useState<BluetoothStatus>('idle');
  const [bluetoothError, setBluetoothError] = useState('');
  const [device, setDevice] = useState<BluetoothDeviceLike | null>(null);

  useEffect(() => {
    const update = () => setNetwork(readNetworkSnapshot());
    const connection = getNetworkInformation();
    globalThis.addEventListener('online', update);
    globalThis.addEventListener('offline', update);
    connection?.addEventListener('change', update);
    return () => {
      globalThis.removeEventListener('online', update);
      globalThis.removeEventListener('offline', update);
      connection?.removeEventListener('change', update);
    };
  }, []);

  useEffect(() => {
    if (!bluetooth?.getAvailability) return;
    let active = true;
    void bluetooth
      .getAvailability()
      .then((available) => {
        if (active) setBluetoothAvailable(available);
      })
      .catch(() => {
        if (active) setBluetoothAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [bluetooth]);

  const testConnection = async () => {
    setTesting(true);
    const startedAt = performance.now();
    try {
      const response = await fetch(`/manifest.webmanifest?network-check=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      setLatency(Math.max(1, Math.round(performance.now() - startedAt)));
      setNetwork(readNetworkSnapshot());
      system.notify('Connection check complete', 'success');
    } catch {
      setLatency(null);
      setNetwork(readNetworkSnapshot());
      system.notify('Connection check failed', 'error');
    } finally {
      setTesting(false);
    }
  };

  const chooseBluetoothDevice = async () => {
    if (!bluetooth) return;
    setBluetoothStatus('choosing');
    setBluetoothError('');
    try {
      const selected = await bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['battery_service', 'device_information'],
      });
      setDevice(selected);
      selected.addEventListener('gattserverdisconnected', () => {
        setBluetoothStatus('idle');
      });
      if (selected.gatt) {
        setBluetoothStatus('connecting');
        await selected.gatt.connect();
      }
      setBluetoothStatus('connected');
      system.notify(`${selected.name || 'Bluetooth device'} connected`, 'success');
    } catch (error) {
      const name = error instanceof DOMException ? error.name : 'BluetoothError';
      if (name === 'NotFoundError') {
        setBluetoothStatus('idle');
        setBluetoothError('No device was selected.');
        return;
      }
      setBluetoothStatus('error');
      setBluetoothError(describeBluetoothError(name));
    }
  };

  const disconnectBluetooth = () => {
    device?.gatt?.disconnect();
    setDevice(null);
    setBluetoothStatus('idle');
    setBluetoothError('');
    system.notify('Bluetooth device disconnected');
  };

  const networkType = formatNetworkType(network.type);
  const quality = formatEffectiveType(network.effectiveType);

  return (
    <div className="connections-app">
      <header className="connections-hero">
        <div>
          <span className="connections-hero__icon">
            <Icon name="connections" size={23} />
          </span>
          <span>
            <small>DEVICE CONNECTIONS</small>
            <h2>Network & Bluetooth</h2>
            <p>Useful connection details, with every permission kept visible.</p>
          </span>
        </div>
        <span className={`connections-status ${network.online ? 'is-online' : 'is-offline'}`}>
          <i />
          {network.online ? 'Online' : 'Offline'}
        </span>
      </header>

      <main className="connections-content">
        <section className="connections-card network-card" aria-labelledby="network-heading">
          <header>
            <span className="connections-card__icon is-network">
              <Icon name="wifi" size={21} />
            </span>
            <div>
              <h3 id="network-heading">Network & Wi-Fi</h3>
              <p>Connection information exposed by this browser.</p>
            </div>
            <button type="button" onClick={() => void testConnection()} disabled={testing}>
              {testing ? 'Testing…' : 'Test connection'}
            </button>
          </header>
          <div className="connection-metrics">
            <Metric
              label="Connection"
              value={networkType}
              detail={network.online ? 'Available' : 'No route'}
            />
            <Metric
              label="Quality"
              value={quality}
              detail={network.effectiveType ? 'Browser estimate' : 'Not exposed'}
            />
            <Metric
              label="Downlink"
              value={network.downlink !== undefined ? `${network.downlink} Mbps` : '—'}
              detail="Estimated"
            />
            <Metric
              label="Round trip"
              value={
                latency !== null
                  ? `${latency} ms`
                  : network.rtt !== undefined
                    ? `${network.rtt} ms`
                    : '—'
              }
              detail={latency !== null ? 'Measured now' : 'Browser estimate'}
            />
          </div>
          <div className="connections-note">
            <Icon name="system" size={16} />
            <p>
              Websites cannot read Wi-Fi names or passwords, scan nearby networks, or change the
              network selected by your operating system. Data Saver is{' '}
              <strong>{network.saveData ? 'on' : 'off or unavailable'}</strong>.
            </p>
          </div>
        </section>

        <section className="connections-card bluetooth-card" aria-labelledby="bluetooth-heading">
          <header>
            <span className="connections-card__icon is-bluetooth">
              <Icon name="bluetooth" size={22} />
            </span>
            <div>
              <h3 id="bluetooth-heading">Bluetooth</h3>
              <p>Connect a nearby low-energy device after approving it.</p>
            </div>
            <span
              className={`connections-availability ${
                bluetoothAvailable ? 'is-supported' : 'is-unsupported'
              }`}
            >
              {bluetoothAvailable === null
                ? 'Checking'
                : bluetoothAvailable
                  ? 'Available'
                  : 'Unavailable'}
            </span>
          </header>

          {device && bluetoothStatus === 'connected' ? (
            <div className="bluetooth-device">
              <span>
                <Icon name="bluetooth" size={22} />
              </span>
              <div>
                <strong>{device.name || 'Bluetooth device'}</strong>
                <small>Connected for this browser session</small>
              </div>
              <button type="button" onClick={disconnectBluetooth}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="bluetooth-empty">
              <div className="bluetooth-rings" aria-hidden="true">
                <span>
                  <Icon name="bluetooth" size={30} />
                </span>
              </div>
              <div>
                <strong>
                  {bluetoothAvailable ? 'Ready to choose a device' : 'Bluetooth API unavailable'}
                </strong>
                <p>
                  {bluetoothAvailable
                    ? 'Your browser will open its own secure device picker. Nimvelis cannot scan silently.'
                    : 'Use a compatible Chromium browser over HTTPS to connect supported Bluetooth LE devices.'}
                </p>
              </div>
              <button
                type="button"
                className="bluetooth-connect"
                disabled={
                  !bluetoothAvailable ||
                  bluetoothStatus === 'choosing' ||
                  bluetoothStatus === 'connecting'
                }
                onClick={() => void chooseBluetoothDevice()}
              >
                <Icon name="bluetooth" size={16} />
                {bluetoothStatus === 'choosing'
                  ? 'Choose in browser…'
                  : bluetoothStatus === 'connecting'
                    ? 'Connecting…'
                    : 'Choose device'}
              </button>
              {bluetoothError ? <small className="bluetooth-error">{bluetoothError}</small> : null}
            </div>
          )}
          <div className="connections-capabilities">
            <span>
              <Icon name="check" size={14} />
              Explicit permission
            </span>
            <span>
              <Icon name="check" size={14} />
              Session connection
            </span>
            <span>
              <Icon name="close" size={14} />
              No silent scanning
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function getNetworkInformation() {
  const deviceNavigator = navigator as DeviceNavigator;
  return (
    deviceNavigator.connection ?? deviceNavigator.mozConnection ?? deviceNavigator.webkitConnection
  );
}

function readNetworkSnapshot(): NetworkSnapshot {
  const connection = getNetworkInformation();
  return {
    online: navigator.onLine,
    type: connection?.type,
    effectiveType: connection?.effectiveType,
    downlink: connection?.downlink,
    rtt: connection?.rtt,
    saveData: Boolean(connection?.saveData),
  };
}

function formatNetworkType(value?: string) {
  if (!navigator.onLine) return 'Offline';
  if (!value || value === 'unknown') return 'Connected';
  const names: Record<string, string> = {
    wifi: 'Wi-Fi',
    ethernet: 'Ethernet',
    cellular: 'Cellular',
    bluetooth: 'Bluetooth',
    none: 'Offline',
  };
  return names[value] ?? value.charAt(0).toUpperCase() + value.slice(1);
}

function formatEffectiveType(value?: string) {
  if (!value) return navigator.onLine ? 'Available' : 'Offline';
  if (value === 'slow-2g') return 'Very limited';
  if (value === '2g') return 'Limited';
  if (value === '3g') return 'Good';
  return 'Fast';
}

function describeBluetoothError(name: string) {
  if (name === 'SecurityError') return 'Bluetooth requires HTTPS and a direct user action.';
  if (name === 'NotAllowedError') return 'Bluetooth permission was not granted.';
  if (name === 'NetworkError') return 'The device was found but could not be connected.';
  return 'The Bluetooth connection could not be completed.';
}
