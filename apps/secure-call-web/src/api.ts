import { config } from "./config";

export type RoomCreateResponse = {
  roomId: string;
  providerToken: string;
  patientToken: string;
  sharedKey: string;
  expiresInSeconds: number;
};

export async function createRoom(): Promise<RoomCreateResponse> {
  const res = await fetch(`${config.signalingHttp}/api/rooms`, { method: "POST" });
  if (!res.ok) throw new Error(`create room failed: ${res.status}`);
  return (await res.json()) as RoomCreateResponse;
}
