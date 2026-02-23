export const config = {
  // Default to same-origin so we can run behind a single HTTPS tunnel (iPhone Safari requires HTTPS for camera/mic).
  signalingHttp:
    (import.meta.env.VITE_SIGNALING_HTTP as string | undefined) ??
    (typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:8787"),
  signalingWs:
    (import.meta.env.VITE_SIGNALING_WS as string | undefined) ??
    (typeof window !== "undefined"
      ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`
      : "ws://127.0.0.1:8787/ws"),
  turnUrl: import.meta.env.VITE_TURN_URL as string | undefined,
  turnUsername: import.meta.env.VITE_TURN_USERNAME as string | undefined,
  turnPassword: import.meta.env.VITE_TURN_PASSWORD as string | undefined
};
