import { livekitApi } from './api';

type LiveKitRoom = {
  connect: (url: string, token: string) => Promise<void>;
  disconnect: () => void;
  localParticipant?: {
    setMicrophoneEnabled?: (enabled: boolean) => Promise<void>;
  };
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
};

let globalsRegistered = false;

function loadLiveKitModules() {
  const rn = require('@livekit/react-native');
  if (!globalsRegistered) {
    rn.registerGlobals?.();
    globalsRegistered = true;
  }
  return require('livekit-client') as {
    Room: new (options?: Record<string, unknown>) => LiveKitRoom;
    RoomEvent?: Record<string, string>;
  };
}

export async function fetchLiveKitToken(bookingId: string) {
  return livekitApi.getToken(bookingId);
}

export async function connectLiveKitAudio(params: {
  token: string;
  wsUrl: string;
  onConnected?: () => void;
  onDisconnected?: () => void;
  onReconnecting?: () => void;
  onReconnected?: () => void;
}) {
  const { Room, RoomEvent } = loadLiveKitModules();
  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  });

  const events = RoomEvent ?? {};
  room.on?.(events.Connected ?? 'connected', () => params.onConnected?.());
  room.on?.(events.Disconnected ?? 'disconnected', () => params.onDisconnected?.());
  room.on?.(events.Reconnecting ?? 'reconnecting', () => params.onReconnecting?.());
  room.on?.(events.Reconnected ?? 'reconnected', () => params.onReconnected?.());

  await room.connect(params.wsUrl, params.token);
  await room.localParticipant?.setMicrophoneEnabled?.(true);
  params.onConnected?.();

  return room;
}

export async function setLiveKitMicrophone(room: LiveKitRoom | null, enabled: boolean) {
  await room?.localParticipant?.setMicrophoneEnabled?.(enabled);
}

export async function endLiveKitSession(bookingId: string) {
  return livekitApi.endSession(bookingId);
}

export type { LiveKitRoom };
