import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { config } from "../config";
import { arrayBufferToBase64, base64ToArrayBuffer } from "../lib/base64";
import {
  aesGcmDecrypt,
  aesGcmEncrypt,
  deriveFileAesKey,
  exportPublicKeyJwk,
  generateEcdhKeyPair,
  importPeerPublicKeyJwk,
  makeIv,
  randomBytes,
  verificationCode
} from "../lib/crypto";

type Role = "provider" | "patient";

type SignalMsg = { type: "signal"; data: any };

type MaineMedicalCardDraft = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string; // YYYY-MM-DD
  phone: string;
  email: string;
  issuedOn: string; // YYYY-MM-DD
  expiresOn: string; // YYYY-MM-DD
  registryId: string;
};

type CardDraftUrlPayloadV1 = {
  v: 1;
  alg: "hkdf-sha256/aes-256-gcm";
  saltB64u: string;
  ivB64u: string;
  ctB64u: string;
};

type HostMsg = {
  source: "cannaconnect-admin-dashboard";
  event: "set-card-draft";
  sid: string;
  roomId: string;
  card: Partial<MaineMedicalCardDraft>;
  autoSend?: boolean;
};

type DataMsg =
  | { t: "chat"; text: string; ts: number }
  | { t: "key-init"; pub: JsonWebKey; saltB64: string }
  | { t: "key-resp"; pub: JsonWebKey }
  | {
      t: "file-meta";
      id: string;
      name: string;
      size: number;
      mime: string;
      chunks: number;
      chunkSize: number;
      sha256Hex: string;
      enc: { v: 1; scheme: "p256-hkdf-sha256-aesgcm"; prefixB64: string };
    }
  | { t: "file-chunk"; id: string; seq: number; dataB64: string }
  | { t: "file-done"; id: string }
  | { t: "card-draft"; card: MaineMedicalCardDraft }
  | { t: "card-confirm"; cardId: string; card: MaineMedicalCardDraft }
  | { t: "card-edit-request"; cardId: string; note: string };

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    // Safari <14 doesn't support addEventListener on MediaQueryList
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyM = m as any;
    if (typeof m.addEventListener === "function") m.addEventListener("change", onChange);
    else if (typeof anyM.addListener === "function") anyM.addListener(onChange);
    return () => {
      if (typeof m.removeEventListener === "function") m.removeEventListener("change", onChange);
      else if (typeof anyM.removeListener === "function") anyM.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

function StatusPill(props: { label: string; value: string; tone?: "ok" | "warn" | "bad" | "neutral" }) {
  const t = props.tone ?? "neutral";
  const toneStyle =
    t === "ok"
      ? pillOk
      : t === "warn"
        ? pillWarn
        : t === "bad"
          ? pillBad
          : pillNeutral;
  return (
    <span style={{ ...pillBase, ...toneStyle }}>
      <span style={{ opacity: 0.72 }}>{props.label}</span> {props.value}
    </span>
  );
}

function b64uToB64(b64u: string): string {
  let b = b64u.replace(/-/g, "+").replace(/_/g, "/");
  while (b.length % 4) b += "=";
  return b;
}

async function deriveDraftUrlKey(sharedKey: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const ikm = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sharedKey));
  const base = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveKey"]);
  const info = new TextEncoder().encode("cannaconnect:carddraft-url:v1");
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt", "encrypt"]
  );
}

export function RoomPage() {
  const { roomId } = useParams();
  const [sp] = useSearchParams();

  const isNarrow = useMediaQuery("(max-width: 900px)");

  const role = (sp.get("role") as Role | null) ?? null;
  const token = sp.get("token") ?? null;
  const sharedKey = sp.get("k") ?? "";
  const parentOrigin = sp.get("parentOrigin") ?? "";
  const sessionId = sp.get("sid") ?? "";

  function emitToHost(event: string, payload: Record<string, unknown> = {}) {
    // Only send non-sensitive metadata (no tokens, no file contents).
    const msg = {
      source: "cannaconnect-secure-call",
      event,
      roomId: roomId ?? "",
      role: role ?? "",
      sid: sessionId,
      ts: Date.now(),
      payload
    };
    const target = parentOrigin || "*";
    try {
      if (window.opener && !window.opener.closed) window.opener.postMessage(msg, target);
    } catch {
      // ignore
    }
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage(msg, target);
    } catch {
      // ignore
    }
  }

  const [sigStatus, setSigStatus] = useState<string>("init");
  const [peerStatus, setPeerStatus] = useState<"waiting" | "connected" | "disconnected">("waiting");
  const [pcStatus, setPcStatus] = useState<RTCPeerConnectionState>("new");
  const [dataStatus, setDataStatus] = useState<"closed" | "open" | "connecting" | "unknown">("unknown");
  const [fileKeyStatus, setFileKeyStatus] = useState<"off" | "negotiating" | "ready" | "error">("off");
  const [err, setErr] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);
  const [needsUserGestureForAudio, setNeedsUserGestureForAudio] = useState(false);
  const [localMediaEnabled, setLocalMediaEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState<boolean | null>(null);
  const [camEnabled, setCamEnabled] = useState<boolean | null>(null);
  const joinedOkRef = useRef(false);
  const [verify, setVerify] = useState<string>("");
  const [chat, setChat] = useState<Array<{ from: Role; text: string; ts: number }>>([]);
  const [chatDraft, setChatDraft] = useState<string>("");
  const [cardDraft, setCardDraft] = useState<MaineMedicalCardDraft | null>(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardEditNote, setCardEditNote] = useState("");
  const [cardStatus, setCardStatus] = useState<"off" | "sent" | "confirmed" | "edit_requested">("off");
  const [receivedFiles, setReceivedFiles] = useState<
    Array<{ id: string; name: string; size: number; mime: string; url: string; ts: number; verified: boolean; sha256Hex: string }>
  >([]);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);

  const fileBuffersRef = useRef<
    Map<
      string,
      {
        meta: Extract<DataMsg, { t: "file-meta" }>;
        chunks: Array<ArrayBuffer | null>;
        received: number;
      }
    >
  >(new Map());

  const fileKeyRef = useRef<CryptoKey | null>(null);
  const ecdhRef = useRef<{ keyPair: CryptoKeyPair; saltB64: string } | null>(null);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const renegotiateQueuedRef = useRef(false);
  const makingOfferRef = useRef(false);
  const ignoreOfferRef = useRef(false);
  const peerStatusRef = useRef<"waiting" | "connected" | "disconnected">("waiting");
  const pendingCardAutoSendRef = useRef(false);
  const pendingCardToSendRef = useRef<MaineMedicalCardDraft | null>(null);
  const urlCardDraftConsumedRef = useRef(false);

  function resetRemoteStream() {
    const fresh = new MediaStream();
    remoteStreamRef.current = fresh;
    const v = remoteVideoRef.current;
    if (v) {
      v.srcObject = null;
      v.srcObject = fresh;
    }
  }

  const iceServers = useMemo(() => {
    const servers: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];
    if (config.turnUrl && config.turnUsername && config.turnPassword) {
      servers.push({
        urls: config.turnUrl,
        username: config.turnUsername,
        credential: config.turnPassword
      });
    }
    return servers;
  }, []);

  useEffect(() => {
    if (!roomId || !role || !token) {
      setErr("Missing roomId/role/token");
      return;
    }
    if (!config.signalingWs) {
      setErr("VITE_SIGNALING_WS is not set");
      return;
    }

    let cancelled = false;
    const signalingWs = config.signalingWs;

    async function run() {
      setErr(null);
      setMediaWarning(null);
      setNeedsUserGestureForAudio(false);
      setFileKeyStatus("off");
      fileKeyRef.current = null;
      ecdhRef.current = null;
      setReceivedFiles([]);
      setChatDraft("");
      setCardModalOpen(false);
      setCardEditNote("");
      setCardStatus("off");
      joinedOkRef.current = false;
      setLocalMediaEnabled(false);
      for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
      blobUrlsRef.current.clear();

      const polite = role === "patient";

      setSigStatus("requesting media");
      emitToHost("room.init", {});
      let local: MediaStream | null = null;
      try {
        local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (e: any) {
        // Firefox commonly uses: NotFoundError "The object can not be found here."
        const name = String(e?.name ?? "");
        const msg = String(e?.message ?? e ?? "Unable to access camera/microphone.");
        setMediaWarning(
          `Camera/microphone unavailable (${name || "error"}). You can still join and use chat + encrypted file exchange. Details: ${msg}`
        );
        local = null;
      }

      if (cancelled) return;
      localStreamRef.current = local;
      setLocalMediaEnabled(Boolean(local));
      if (local) {
        setMicEnabled(local.getAudioTracks?.()?.[0]?.enabled ?? null);
        setCamEnabled(local.getVideoTracks?.()?.[0]?.enabled ?? null);
      } else {
        setMicEnabled(null);
        setCamEnabled(null);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = local;
        localVideoRef.current.muted = true;
      }

      setSigStatus("connecting signaling");
      const ws = new WebSocket(signalingWs);
      wsRef.current = ws;

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;
      setPcStatus(pc.connectionState);
      setDataStatus("unknown");

      resetRemoteStream();

      // media tracks (optional)
      if (local) {
        for (const track of local.getTracks()) {
          pc.addTrack(track, local);
        }
      } else {
        // Still allow receiving media from the other peer even if we have no local devices.
        // Provider will create the offer; these recvonly transceivers ensure m-lines exist.
        pc.addTransceiver("audio", { direction: "recvonly" });
        pc.addTransceiver("video", { direction: "recvonly" });
      }

      pc.ontrack = (ev) => {
        // Always add to the current remote stream (we may replace it to clear "frozen" frames).
        remoteStreamRef.current?.addTrack(ev.track);
        // Some browsers block audio autoplay until a user gesture.
        const v = remoteVideoRef.current;
        if (v) {
          v.play()
            .then(() => setNeedsUserGestureForAudio(false))
            .catch(() => setNeedsUserGestureForAudio(true));
        }
      };

      pc.onicecandidate = (ev) => {
        if (!ev.candidate) return;
        ws.send(JSON.stringify({ type: "signal", data: { kind: "ice", candidate: ev.candidate } }));
      };

      pc.onconnectionstatechange = () => {
        setPcStatus(pc.connectionState);
        emitToHost("pc.state", { state: pc.connectionState });
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
          resetRemoteStream();
          setNeedsUserGestureForAudio(false);
        }
        if (pc.connectionState === "connected") {
          void updateVerificationCode();
        }
      };

      async function negotiate() {
        if (makingOfferRef.current) return;
        if (ws.readyState !== ws.OPEN) return;
        makingOfferRef.current = true;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          ws.send(JSON.stringify({ type: "signal", data: { kind: "sdp", description: pc.localDescription } }));
        } finally {
          makingOfferRef.current = false;
        }
      }

      pc.onnegotiationneeded = async () => {
        // Keep initial negotiation provider-led to avoid offer collisions.
        // After connect, allow either side to renegotiate (ex: patient enables camera later).
        if (role !== "provider" && pc.connectionState !== "connected") return;
        if (peerStatusRef.current !== "connected") {
          renegotiateQueuedRef.current = true;
          return;
        }
        await negotiate();
      };

      function attachDataChannel(dc: RTCDataChannel) {
        dcRef.current = dc;
        dc.binaryType = "arraybuffer";

        setDataStatus(dc.readyState === "open" ? "open" : dc.readyState === "connecting" ? "connecting" : "closed");
        dc.onopen = () => {
          setDataStatus("open");
          emitToHost("data.open", {});
          // Start app-layer E2EE negotiation for files.
          void maybeStartFileKeyNegotiation();
          if (pendingCardAutoSendRef.current) trySendQueuedCardDraft();
        };
        dc.onclose = () => {
          setDataStatus("closed");
          emitToHost("data.closed", {});
        };
        dc.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data)) as DataMsg;
            void onDataMsg(parsed);
          } catch {
            // ignore
          }
        };
      }

      pc.ondatachannel = (ev) => attachDataChannel(ev.channel);

      // initiator creates datachannel
      if (role === "provider") {
        attachDataChannel(pc.createDataChannel("data"));
      }

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "join", roomId, token }));
      };

      ws.onmessage = async (ev) => {
        let msg: any;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          return;
        }

        if (msg.type === "joined") {
          setSigStatus(`joined:${msg.role}`);
          joinedOkRef.current = true;
          emitToHost("sig.joined", { role: msg.role });
          return;
        }

        if (msg.type === "peer") {
          setPeerStatus(msg.status);
          peerStatusRef.current = msg.status;
          emitToHost("peer.status", { status: msg.status, otherRole: msg.role });
          if (msg.status === "disconnected") {
            resetRemoteStream();
            setNeedsUserGestureForAudio(false);
          }
          // If we queued negotiation while waiting for the peer, run it now.
          if (msg.status === "connected" && renegotiateQueuedRef.current) {
            renegotiateQueuedRef.current = false;
            await negotiate();
          }
          return;
        }

        const sig = msg as SignalMsg;
        if (sig.type !== "signal") return;

        const data = sig.data;
        if (data?.kind === "ice") {
          try {
            if (!pc.remoteDescription) {
              pendingIceRef.current.push(data.candidate);
              return;
            }
            await pc.addIceCandidate(data.candidate);
          } catch {
            // ignore
          }
          return;
        }

        if (data?.kind === "sdp") {
          const desc = new RTCSessionDescription(data.description);
          const offerCollision = desc.type === "offer" && (makingOfferRef.current || pc.signalingState !== "stable");
          ignoreOfferRef.current = !polite && offerCollision;
          if (ignoreOfferRef.current) return;

          try {
            if (offerCollision && polite) {
              // Best-effort rollback. Not all browsers support it, but most modern ones do.
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await pc.setLocalDescription({ type: "rollback" } as any);
            }
          } catch {
            // ignore rollback failures
          }

          await pc.setRemoteDescription(desc);
          if (pendingIceRef.current.length) {
            const pending = pendingIceRef.current.splice(0, pendingIceRef.current.length);
            for (const c of pending) {
              try {
                await pc.addIceCandidate(c);
              } catch {
                // ignore
              }
            }
          }
          if (desc.type === "offer") {
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: "signal", data: { kind: "sdp", description: pc.localDescription } }));
          }
          return;
        }
      };

      ws.onerror = () => setErr("signaling error");
      ws.onclose = (ev) => {
        setSigStatus("signaling closed");
        emitToHost("sig.closed", { code: ev.code, reason: ev.reason || "" });
        // You can still load the /r/:roomId route even if the session doesn't exist.
        // If we never got a successful join, treat it as an expired/invalid room link.
        if (!joinedOkRef.current) {
          const reason = ev.reason ? ` (${ev.code}: ${ev.reason})` : ` (${ev.code})`;
          setErr(`Session expired or server restarted. Create a new session.${reason}`);
          setPeerStatus("disconnected");
          setDataStatus("closed");
          setFileKeyStatus("off");
        }
      };

      async function updateVerificationCode() {
        if (!sharedKey) return;
        const fps = await getFingerprints(pc);
        if (!fps) return;
        const code = await verificationCode({ sharedKey, localFingerprint: fps.local, remoteFingerprint: fps.remote });
        setVerify(code);
      }

      async function maybeStartFileKeyNegotiation() {
        if (fileKeyRef.current) return;
        if (fileKeyStatus === "negotiating" || fileKeyStatus === "ready") return;
        if (role !== "provider") return;
        const dc = dcRef.current;
        if (!dc || dc.readyState !== "open") return;

        setFileKeyStatus("negotiating");
        try {
          const keyPair = await generateEcdhKeyPair();
          const salt = randomBytes(16);
          const saltB64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);
          const pub = await exportPublicKeyJwk(keyPair.publicKey);
          ecdhRef.current = { keyPair, saltB64 };
          const msg: DataMsg = { t: "key-init", pub, saltB64 };
          dc.send(JSON.stringify(msg));
        } catch (e: any) {
          setFileKeyStatus("error");
          setErr(`File encryption init failed: ${String(e?.message ?? e)}`);
        }
      }

      async function onDataMsg(m: DataMsg) {
        if (m.t === "chat") {
          setChat((c) => [...c, { from: role === "provider" ? "patient" : "provider", text: m.text, ts: m.ts }]);
          return;
        }
        if (m.t === "file-done") return;

        if (m.t === "card-draft") {
          setCardDraft(m.card);
          setCardModalOpen(true);
          setCardEditNote("");
          setCardStatus("sent");
          return;
        }
        if (m.t === "card-confirm") {
          setCardStatus("confirmed");
          emitToHost("card.confirmed", { cardId: m.cardId });
          return;
        }
        if (m.t === "card-edit-request") {
          setCardStatus("edit_requested");
          emitToHost("card.edit_requested", { cardId: m.cardId });
          return;
        }

        if (m.t === "key-init") {
          if (fileKeyRef.current) return;
          const dc = dcRef.current;
          if (!dc || dc.readyState !== "open") return;

          setFileKeyStatus("negotiating");
          try {
            const peerPub = await importPeerPublicKeyJwk(m.pub);
            const keyPair = await generateEcdhKeyPair();
            const myPub = await exportPublicKeyJwk(keyPair.publicKey);

            // Derive key using provider-provided salt.
            const salt = new Uint8Array(base64ToArrayBuffer(m.saltB64));
            const key = await deriveFileAesKey({
              privateKey: keyPair.privateKey,
              peerPublicKey: peerPub,
              salt
            });

            fileKeyRef.current = key;
            setFileKeyStatus("ready");

            const resp: DataMsg = { t: "key-resp", pub: myPub };
            dc.send(JSON.stringify(resp));
          } catch (e: any) {
            setFileKeyStatus("error");
            setErr(`File encryption negotiation failed: ${String(e?.message ?? e)}`);
          }
          return;
        }

        if (m.t === "key-resp") {
          if (fileKeyRef.current) return;
          if (role !== "provider") return;
          const st = ecdhRef.current;
          if (!st) return;

          setFileKeyStatus("negotiating");
          try {
            const peerPub = await importPeerPublicKeyJwk(m.pub);
            const salt = new Uint8Array(base64ToArrayBuffer(st.saltB64));
            const key = await deriveFileAesKey({
              privateKey: st.keyPair.privateKey,
              peerPublicKey: peerPub,
              salt
            });
            fileKeyRef.current = key;
            setFileKeyStatus("ready");
          } catch (e: any) {
            setFileKeyStatus("error");
            setErr(`File encryption finalize failed: ${String(e?.message ?? e)}`);
          }
          return;
        }

        if (m.t === "file-meta") {
          fileBuffersRef.current.set(m.id, {
            meta: m,
            chunks: new Array(m.chunks).fill(null),
            received: 0
          });
          return;
        }

        if (m.t === "file-chunk") {
          const entry = fileBuffersRef.current.get(m.id);
          if (!entry) return;
          if (entry.chunks[m.seq] != null) return;

          // Decrypt file chunk (application-layer E2EE).
          const key = fileKeyRef.current;
          if (!key) {
            setErr("Received encrypted file data but file key is not ready.");
            return;
          }

          const prefix = new Uint8Array(base64ToArrayBuffer(entry.meta.enc.prefixB64));
          const iv = makeIv(prefix, m.seq);
          const aad = new TextEncoder().encode(`${entry.meta.id}:${m.seq}`);
          try {
            const pt = await aesGcmDecrypt({
              key,
              iv,
              ciphertext: base64ToArrayBuffer(m.dataB64),
              aad
            });
            entry.chunks[m.seq] = pt;
          } catch (e: any) {
            setErr(`Failed to decrypt file chunk ${m.seq}: ${String(e?.message ?? e)}`);
            return;
          }

          entry.received++;
          if (entry.received === entry.meta.chunks) {
            const merged = mergeBuffers(entry.chunks as Array<ArrayBuffer>);
            const gotHash = await sha256ArrayBufferHex(merged);
            const verified = gotHash.toLowerCase() === entry.meta.sha256Hex.toLowerCase();
            const blob = new Blob([merged], { type: entry.meta.mime });
            const url = URL.createObjectURL(blob);
            blobUrlsRef.current.add(url);
            emitToHost("file.received", { name: entry.meta.name, size: entry.meta.size, verified });
            setReceivedFiles((prev) => [
              {
                id: entry.meta.id,
                name: entry.meta.name,
                size: entry.meta.size,
                mime: entry.meta.mime,
                url,
                ts: Date.now(),
                verified,
                sha256Hex: gotHash
              },
              ...prev
            ]);
            fileBuffersRef.current.delete(m.id);
          }
          return;
        }
      }

      function mergeBuffers(parts: Array<ArrayBuffer>): ArrayBuffer {
        const total = parts.reduce((n, p) => n + p.byteLength, 0);
        const out = new Uint8Array(total);
        let off = 0;
        for (const p of parts) {
          out.set(new Uint8Array(p), off);
          off += p.byteLength;
        }
        return out.buffer;
      }

      async function getFingerprints(conn: RTCPeerConnection): Promise<{ local: string; remote: string } | null> {
        try {
          const stats = await conn.getStats();
          let transport: any = null;
          stats.forEach((r) => {
            if (r.type === "transport") transport = r;
          });
          const localId = transport?.localCertificateId;
          const remoteId = transport?.remoteCertificateId;
          let localFp = "";
          let remoteFp = "";
          stats.forEach((r) => {
            if (r.type !== "certificate") return;
            if (r.id === localId) localFp = r.fingerprint;
            if (r.id === remoteId) remoteFp = r.fingerprint;
          });
          if (!localFp || !remoteFp) return null;
          return { local: localFp, remote: remoteFp };
        } catch {
          return null;
        }
      }
    }

    run().catch((e) => setErr(e?.message ?? String(e)));

    return () => {
      cancelled = true;
      wsRef.current?.close();
      pcRef.current?.close();
      for (const t of localStreamRef.current?.getTracks?.() ?? []) t.stop();
      for (const url of blobUrlsRef.current) URL.revokeObjectURL(url);
      blobUrlsRef.current.clear();
    };
  }, [roomId, role, token]);

  const otherRole: Role | null = role ? (role === "provider" ? "patient" : "provider") : null;
  const localVideoLabel = role === "provider" ? "Provider (You)" : role === "patient" ? "Patient (You)" : "You";
  const remoteVideoLabel = role === "provider" ? "Patient" : role === "patient" ? "Provider" : "Other Participant";

  function blankCardDraft(): MaineMedicalCardDraft {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const issuedOn = `${yyyy}-${mm}-${dd}`;
    const expiresOn = `${yyyy + 1}-${mm}-${dd}`;
    return {
      id: crypto.randomUUID(),
      firstName: "",
      lastName: "",
      dob: "",
      phone: "",
      email: "",
      issuedOn,
      expiresOn,
      registryId: ""
    };
  }

  useEffect(() => {
    // Provider starts with a blank draft by default.
    if (role === "provider" && !cardDraft) {
      setCardDraft(blankCardDraft());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    // Fallback path for mobile Safari where postMessage into a newly-opened tab can be flaky:
    // accept an encrypted card draft in the URL fragment (`#cd=...`), decrypt with sharedKey,
    // and optionally queue an auto-send to the patient once the data channel is open.
    if (urlCardDraftConsumedRef.current) return;
    if (role !== "provider") return;
    if (!sharedKey) return;
    if (typeof window === "undefined") return;

    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const cd = new URLSearchParams(hash).get("cd");
    if (!cd) return;

    urlCardDraftConsumedRef.current = true;

    void (async () => {
      try {
        const payloadJson = new TextDecoder().decode(base64ToArrayBuffer(b64uToB64(cd)));
        const p = JSON.parse(payloadJson) as CardDraftUrlPayloadV1;
        if (!p || p.v !== 1 || p.alg !== "hkdf-sha256/aes-256-gcm") throw new Error("Unsupported draft payload");

        const salt = base64ToArrayBuffer(b64uToB64(p.saltB64u));
        const iv = new Uint8Array(base64ToArrayBuffer(b64uToB64(p.ivB64u)));
        const ct = base64ToArrayBuffer(b64uToB64(p.ctB64u));
        const key = await deriveDraftUrlKey(sharedKey, salt);
        const pt = await aesGcmDecrypt({ key, iv, ciphertext: ct });
        const decoded = JSON.parse(new TextDecoder().decode(pt)) as { card: MaineMedicalCardDraft; autoSend?: boolean };

        if (!decoded?.card) throw new Error("Missing card draft");
        setCardDraft(decoded.card);
        setCardStatus("off");
        emitToHost("card.draft.set", { cardId: decoded.card.id, autoSend: Boolean(decoded.autoSend) });

        if (decoded.autoSend) {
          pendingCardToSendRef.current = decoded.card;
          pendingCardAutoSendRef.current = true;
          trySendQueuedCardDraft();
        }

        // Remove the fragment after processing to avoid accidental copy/paste of the payload.
        try {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        } catch {
          // ignore
        }
      } catch (e: any) {
        setErr(`Failed to load draft from link: ${String(e?.message ?? e)}`);
      }
    })();
  }, [role, sharedKey]);

  function normalizeCardDraft(partial: Partial<MaineMedicalCardDraft>): MaineMedicalCardDraft {
    const base = blankCardDraft();
    const merged = { ...base, ...partial } as MaineMedicalCardDraft;
    if (!merged.id) merged.id = crypto.randomUUID();
    return merged;
  }

  function trySendQueuedCardDraft() {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const card = pendingCardToSendRef.current;
    if (!card) return;
    const msg: DataMsg = { t: "card-draft", card };
    dc.send(JSON.stringify(msg));
    pendingCardToSendRef.current = null;
    pendingCardAutoSendRef.current = false;
    setCardStatus("sent");
    emitToHost("card.draft.sent", { cardId: card.id });
  }

  useEffect(() => {
    // Allow the admin dashboard to inject a card draft (derived from ID scan / intake form)
    // into the provider window. Security model: require an explicit parentOrigin AND
    // match the session id ("sid") passed in the room URL.
    function onHostMessage(ev: MessageEvent) {
      if (role !== "provider") return;
      if (!parentOrigin) return;
      if (ev.origin !== parentOrigin) return;
      const d = ev.data as HostMsg;
      if (!d || d.source !== "cannaconnect-admin-dashboard") return;
      if (d.event !== "set-card-draft") return;
      if (!sessionId || d.sid !== sessionId) return;
      if (roomId && d.roomId && d.roomId !== roomId) return;

      const normalized = normalizeCardDraft(d.card ?? {});
      setCardDraft(normalized);
      setCardStatus("off");
      emitToHost("card.draft.set", { cardId: normalized.id, autoSend: Boolean(d.autoSend) });

      if (d.autoSend) {
        pendingCardToSendRef.current = normalized;
        pendingCardAutoSendRef.current = true;
        // If we're already connected, send immediately; otherwise dc.onopen will send.
        trySendQueuedCardDraft();
      }
    }

    window.addEventListener("message", onHostMessage);
    return () => window.removeEventListener("message", onHostMessage);
  }, [role, parentOrigin, sessionId, roomId]);

  async function sendChat(text: string): Promise<boolean> {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      setErr("Not connected yet. Wait until Data channel shows OPEN.");
      return false;
    }
    const msg: DataMsg = { t: "chat", text, ts: Date.now() };
    dc.send(JSON.stringify(msg));
    setChat((c) => [...c, { from: role!, text, ts: msg.ts }]);
    return true;
  }

  function toggleMic() {
    const s = localStreamRef.current;
    const t = s?.getAudioTracks?.()?.[0];
    if (!t) {
      setErr("No microphone track available.");
      return;
    }
    t.enabled = !t.enabled;
    setMicEnabled(t.enabled);
    setLocalMediaEnabled(true);
  }

  function toggleCam() {
    const s = localStreamRef.current;
    const t = s?.getVideoTracks?.()?.[0];
    if (!t) {
      setErr("No camera track available.");
      return;
    }
    t.enabled = !t.enabled;
    setCamEnabled(t.enabled);
    setLocalMediaEnabled(true);
  }

  async function enableLocalMedia() {
    if (localStreamRef.current) return;
    setErr(null);
    setMediaWarning(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = s;
      setLocalMediaEnabled(true);
      setMicEnabled(s.getAudioTracks?.()?.[0]?.enabled ?? null);
      setCamEnabled(s.getVideoTracks?.()?.[0]?.enabled ?? null);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = s;
        localVideoRef.current.muted = true;
      }

      const pc = pcRef.current;
      if (pc) {
        for (const track of s.getTracks()) {
          try {
            pc.addTrack(track, s);
          } catch {
            // ignore
          }
        }
      }
    } catch (e: any) {
      const name = String(e?.name ?? "");
      const msg = String(e?.message ?? e ?? "Unable to access camera/microphone.");
      setMediaWarning(`Camera/microphone unavailable (${name || "error"}). Details: ${msg}`);
    }
  }

  async function enableAudioPlayback() {
    const v = remoteVideoRef.current;
    if (!v) return;
    try {
      await v.play();
      setNeedsUserGestureForAudio(false);
    } catch {
      setNeedsUserGestureForAudio(true);
    }
  }

  async function sendFile(file: File) {
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      setErr("Not connected yet. Wait until Data channel shows OPEN.");
      return;
    }
    const key = fileKeyRef.current;
    if (!key) {
      setErr("File encryption key not ready yet. Wait until File key shows READY.");
      return;
    }

    // Keep v1 conservative: avoid huge memory spikes.
    const maxBytes = 8 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErr(`File too large for v1 (max ${Math.round(maxBytes / 1024 / 1024)}MB)`);
      return;
    }

    const chunkSize = 32 * 1024;
    const id = crypto.randomUUID();
    const chunks = Math.ceil(file.size / chunkSize);
    const prefix = randomBytes(4);
    const prefixB64 = arrayBufferToBase64(prefix.buffer as ArrayBuffer);

    const buf = await file.arrayBuffer();
    const sha256Hex = await sha256ArrayBufferHex(buf);

    const meta: DataMsg = {
      t: "file-meta",
      id,
      name: file.name,
      size: file.size,
      mime: file.type || "application/octet-stream",
      chunks,
      chunkSize,
      sha256Hex,
      enc: { v: 1, scheme: "p256-hkdf-sha256-aesgcm", prefixB64 }
    };

    dc.send(JSON.stringify(meta));
    for (let seq = 0; seq < chunks; seq++) {
      const start = seq * chunkSize;
      const end = Math.min(buf.byteLength, start + chunkSize);
      const part = buf.slice(start, end);

      const iv = makeIv(prefix, seq);
      const aad = new TextEncoder().encode(`${id}:${seq}`);
      const ct = await aesGcmEncrypt({ key, iv, plaintext: part, aad });
      const dataB64 = arrayBufferToBase64(ct);

      const msg: DataMsg = { t: "file-chunk", id, seq, dataB64 };
      dc.send(JSON.stringify(msg));
      // Basic backpressure: wait if buffer gets big.
      if (dc.bufferedAmount > 4 * 1024 * 1024) {
        await new Promise<void>((resolve) => {
          const onLow = () => {
            if (dc.bufferedAmount < 512 * 1024) {
              dc.removeEventListener("bufferedamountlow", onLow);
              resolve();
            }
          };
          dc.bufferedAmountLowThreshold = 512 * 1024;
          dc.addEventListener("bufferedamountlow", onLow);
        });
      }
    }
  }

  async function sendCardDraftToPeer() {
    if (role !== "provider") return;
    if (!cardDraft) return;
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") {
      setErr("Not connected yet. Wait until Data channel shows OPEN.");
      return;
    }
    const msg: DataMsg = { t: "card-draft", card: cardDraft };
    dc.send(JSON.stringify(msg));
    setCardStatus("sent");
    emitToHost("card.draft.sent", { cardId: cardDraft.id });
  }

  async function confirmCard() {
    if (role !== "patient" || !cardDraft) return;
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const msg: DataMsg = { t: "card-confirm", cardId: cardDraft.id, card: cardDraft };
    dc.send(JSON.stringify(msg));
    setCardModalOpen(false);
    setCardStatus("confirmed");
  }

  async function requestCardEdit() {
    if (role !== "patient" || !cardDraft) return;
    const dc = dcRef.current;
    if (!dc || dc.readyState !== "open") return;
    const note = cardEditNote.trim();
    const msg: DataMsg = { t: "card-edit-request", cardId: cardDraft.id, note: note || "Please correct the card details." };
    dc.send(JSON.stringify(msg));
    setCardModalOpen(false);
    setCardStatus("edit_requested");
  }

  return (
    <div style={page}>
      {cardModalOpen && cardDraft ? (
        <div style={modalBackdrop} role="dialog" aria-modal="true">
          <div style={modalCard}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 900, letterSpacing: -0.4 }}>Maine Medical Card Preview</div>
                <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 12, lineHeight: 1.35 }}>
                  Review the card details. Confirm if correct, or request an edit.
                </div>
              </div>
              <button style={smallBtn} onClick={() => setCardModalOpen(false)}>
                Close
              </button>
            </div>

            <div style={maineCard}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={{ fontWeight: 900, letterSpacing: -0.3 }}>State of Maine</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>Medical Use of Cannabis Program</div>
                </div>
                <div style={seal}>ME</div>
              </div>
              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                <div style={cardRow}>
                  <span style={cardLabel}>Name</span>
                  <span style={cardValue}>
                    {cardDraft.firstName || "—"} {cardDraft.lastName || ""}
                  </span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>Date of Birth</span>
                  <span style={cardValue}>{cardDraft.dob || "—"}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>Registry ID</span>
                  <span style={cardValue}>{cardDraft.registryId || "—"}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>Issued</span>
                  <span style={cardValue}>{cardDraft.issuedOn || "—"}</span>
                </div>
                <div style={cardRow}>
                  <span style={cardLabel}>Expires</span>
                  <span style={cardValue}>{cardDraft.expiresOn || "—"}</span>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 11, opacity: 0.75, lineHeight: 1.35 }}>
                This is a preview for patient confirmation. Final issuance rules may vary.
              </div>
            </div>

            {role === "patient" ? (
              <div style={{ display: "grid", gap: 10 }}>
                <textarea
                  value={cardEditNote}
                  onChange={(e) => setCardEditNote(e.target.value)}
                  placeholder="Optional: if anything is wrong, write what to change..."
                  style={textarea}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  <button style={smallBtn} onClick={() => void requestCardEdit()}>
                    Request Edit
                  </button>
                  <button style={{ ...smallBtn, ...primarySmallBtn }} onClick={() => void confirmCard()}>
                    Confirm
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                Waiting for patient to confirm or request edits.
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div style={topbar}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontWeight: 800, letterSpacing: -0.2 }}>Room {roomId}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <StatusPill label="Role" value={`${role ?? "?"}${otherRole && peerStatus !== "connected" ? ` (waiting for ${otherRole})` : ""}`} />
            <StatusPill label="Peer" value={peerStatus.toUpperCase()} tone={peerStatus === "connected" ? "ok" : peerStatus === "waiting" ? "warn" : "bad"} />
            <StatusPill label="PC" value={pcStatus.toUpperCase()} tone={pcStatus === "connected" ? "ok" : pcStatus === "failed" ? "bad" : "neutral"} />
            <StatusPill
              label="Data"
              value={peerStatus !== "connected" && dataStatus !== "open" ? "WAITING" : dataStatus.toUpperCase()}
              tone={dataStatus === "open" ? "ok" : peerStatus !== "connected" ? "warn" : dataStatus === "closed" ? "bad" : "neutral"}
            />
            <StatusPill label="File" value={fileKeyStatus.toUpperCase()} tone={fileKeyStatus === "ready" ? "ok" : fileKeyStatus === "error" ? "bad" : "neutral"} />
            <StatusPill label="Sig" value={sigStatus} tone={sigStatus.startsWith("joined") ? "ok" : sigStatus.includes("closed") ? "bad" : "neutral"} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={chip}>Media: {localMediaEnabled ? "ON" : "OFF"}</span>
            <span style={chip}>Mic: {micEnabled == null ? "N/A" : micEnabled ? "ON" : "OFF"}</span>
            <span style={chip}>Cam: {camEnabled == null ? "N/A" : camEnabled ? "ON" : "OFF"}</span>
            {!localStreamRef.current ? (
              <button style={smallBtn} onClick={() => void enableLocalMedia()}>
                Enable Camera/Mic
              </button>
            ) : null}
            <button style={smallBtn} onClick={toggleMic} disabled={!localStreamRef.current}>
              Toggle Mic
            </button>
            <button style={smallBtn} onClick={toggleCam} disabled={!localStreamRef.current}>
              Toggle Cam
            </button>
            {needsUserGestureForAudio ? (
              <button style={smallBtn} onClick={() => void enableAudioPlayback()}>
                Enable Audio
              </button>
            ) : null}
          </div>
          {verify ? (
            <div style={{ color: "rgba(220,255,240,0.92)", fontSize: 12 }}>
              Verify code (say out loud to confirm): <span style={mono}>{verify}</span>
            </div>
          ) : null}
        </div>
        {role === "provider" ? (
          <a href="/" style={linkBtn}>
            New Session
          </a>
        ) : (
          <a href="/" style={linkBtn}>
            Leave
          </a>
        )}
      </div>

      {err ? <div style={errBox}>{err}</div> : null}
      {mediaWarning ? <div style={warnBox}>{mediaWarning}</div> : null}

      <div style={{ ...grid, gridTemplateColumns: isNarrow ? "1fr" : grid.gridTemplateColumns }}>
        <div style={videoCard}>
          <div style={videoHeader}>{localVideoLabel}</div>
          <video ref={localVideoRef} playsInline autoPlay muted style={{ ...video, height: isNarrow ? "34vh" : video.height }} />
        </div>
        <div style={videoCard}>
          <div style={videoHeader}>{remoteVideoLabel}</div>
          <video ref={remoteVideoRef} playsInline autoPlay style={{ ...video, height: isNarrow ? "34vh" : video.height }} />
        </div>
      </div>

      <div style={{ ...bottom, gridTemplateColumns: isNarrow ? "1fr" : bottom.gridTemplateColumns }}>
        <div style={panel}>
          <div style={panelTitle}>Chat</div>
          <div style={chatBox}>
            {chat.map((m, idx) => (
              <div key={`${m.ts}-${m.from}-${idx}`} style={{ opacity: 0.95 }}>
                <span style={{ color: m.from === role ? "rgba(40,210,160,0.95)" : "rgba(255,255,255,0.75)", fontWeight: 700 }}>
                  {m.from}
                </span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>:</span> {m.text}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = chatDraft.trim();
              if (!text) return;
              void sendChat(text).then((sent) => {
                if (sent) setChatDraft("");
              });
            }}
            style={{ display: "flex", gap: 10 }}
          >
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              placeholder={dataStatus === "open" ? "Type..." : "Waiting for connection..."}
              style={input}
              disabled={dataStatus !== "open"}
            />
            <button style={{ ...btn, opacity: dataStatus === "open" ? 1 : 0.6, cursor: dataStatus === "open" ? "pointer" : "not-allowed" }} disabled={dataStatus !== "open"}>
              Send
            </button>
          </form>
        </div>

        <div style={panel}>
          <div style={panelTitle}>Encrypted File Exchange</div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.4 }}>
            Files are encrypted in-app (AES-GCM) and sent over the WebRTC data channel. Receiver can download from the list below.
          </div>
          <div style={fileList}>
            {receivedFiles.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>No received files yet.</div>
            ) : (
              receivedFiles.map((f) => (
                <div key={f.id} style={fileRow}>
                  <div style={{ display: "grid", gap: 2, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                      <span style={f.verified ? okPill : badPill}>{f.verified ? "Verified" : "Hash mismatch"}</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                      {Math.round(f.size / 1024)} KB · sha256 {f.sha256Hex.slice(0, 12)}…
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={smallBtn}
                      onClick={() => {
                        const a = document.createElement("a");
                        a.href = f.url;
                        a.download = f.name;
                        a.click();
                      }}
                    >
                      Download
                    </button>
                    <button
                      style={{ ...smallBtn, background: "rgba(255,255,255,0.03)" }}
                      onClick={() => {
                        setReceivedFiles((prev) => prev.filter((x) => x.id !== f.id));
                        if (blobUrlsRef.current.has(f.url)) {
                          URL.revokeObjectURL(f.url);
                          blobUrlsRef.current.delete(f.url);
                        }
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <input
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void sendFile(f);
              e.currentTarget.value = "";
            }}
            style={{ ...input, padding: 10 }}
            disabled={dataStatus !== "open" || fileKeyStatus !== "ready"}
          />
          <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
            v1 limit: 8MB per file.
          </div>

          <div style={{ marginTop: 6, borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 10, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>Medical Card (Draft)</div>
              <span style={cardStatusPill}>
                <span style={{ opacity: 0.72 }}>status</span> {cardStatus.replace("_", " ").toUpperCase()}
              </span>
            </div>

            {role === "provider" && cardDraft ? (
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <input
                    style={input}
                    placeholder="First name"
                    value={cardDraft.firstName}
                    onChange={(e) => setCardDraft({ ...cardDraft, firstName: e.target.value })}
                  />
                  <input
                    style={input}
                    placeholder="Last name"
                    value={cardDraft.lastName}
                    onChange={(e) => setCardDraft({ ...cardDraft, lastName: e.target.value })}
                  />
                  <input
                    style={input}
                    placeholder="DOB (YYYY-MM-DD)"
                    value={cardDraft.dob}
                    onChange={(e) => setCardDraft({ ...cardDraft, dob: e.target.value })}
                  />
                  <input
                    style={input}
                    placeholder="Registry ID"
                    value={cardDraft.registryId}
                    onChange={(e) => setCardDraft({ ...cardDraft, registryId: e.target.value })}
                  />
                  <input
                    style={input}
                    placeholder="Phone"
                    value={cardDraft.phone}
                    onChange={(e) => setCardDraft({ ...cardDraft, phone: e.target.value })}
                  />
                  <input
                    style={input}
                    placeholder="Email"
                    value={cardDraft.email}
                    onChange={(e) => setCardDraft({ ...cardDraft, email: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                  <input
                    style={input}
                    placeholder="Issued on (YYYY-MM-DD)"
                    value={cardDraft.issuedOn}
                    onChange={(e) => setCardDraft({ ...cardDraft, issuedOn: e.target.value })}
                  />
                  <input
                    style={input}
                    placeholder="Expires on (YYYY-MM-DD)"
                    value={cardDraft.expiresOn}
                    onChange={(e) => setCardDraft({ ...cardDraft, expiresOn: e.target.value })}
                  />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={{ ...smallBtn, ...primarySmallBtn }} disabled={dataStatus !== "open"} onClick={() => void sendCardDraftToPeer()}>
                    Send Draft To Patient
                  </button>
                  <button style={smallBtn} onClick={() => setCardModalOpen(true)} disabled={!cardDraft}>
                    Preview
                  </button>
                </div>
              </div>
            ) : null}

            {role === "patient" ? (
              <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ color: "rgba(255,255,255,0.70)", fontSize: 12 }}>
                  {cardDraft ? "A draft card is available for review." : "No draft card yet."}
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={smallBtn} onClick={() => setCardModalOpen(true)} disabled={!cardDraft}>
                    Review
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

async function sha256ArrayBufferHex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const page: React.CSSProperties = {
  minHeight: "100svh",
  background: "radial-gradient(1100px 640px at 25% 0%, rgba(20,150,120,0.18), transparent 60%), radial-gradient(900px 640px at 80% 10%, rgba(180,70,140,0.12), transparent 55%), #07090c",
  color: "white",
  padding: "calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))",
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto",
  gap: 14
};

const topbar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.03)"
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12
};

const videoCard: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.03)",
  overflow: "hidden",
  display: "grid",
  gridTemplateRows: "auto 1fr"
};

const videoHeader: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  color: "rgba(255,255,255,0.75)",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 0.3,
  textTransform: "uppercase"
};

const video: React.CSSProperties = {
  width: "100%",
  height: "52vh",
  objectFit: "cover",
  background: "rgba(0,0,0,0.35)"
};

const bottom: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12
};

const panel: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.03)",
  padding: 12,
  display: "grid",
  gap: 10
};

const panelTitle: React.CSSProperties = {
  fontWeight: 800,
  letterSpacing: -0.2
};

const okPill: React.CSSProperties = {
  border: "1px solid rgba(40,210,160,0.25)",
  background: "rgba(40,210,160,0.10)",
  color: "rgba(220,255,240,0.95)",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  flex: "0 0 auto"
};

const badPill: React.CSSProperties = {
  border: "1px solid rgba(255,80,80,0.25)",
  background: "rgba(255,80,80,0.10)",
  color: "rgba(255,210,210,0.95)",
  padding: "2px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  flex: "0 0 auto"
};

const fileList: React.CSSProperties = {
  display: "grid",
  gap: 8,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
  borderRadius: 12,
  padding: 10
};

const fileRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10
};

const chatBox: React.CSSProperties = {
  height: 140,
  overflow: "auto",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
  borderRadius: 12,
  padding: 10,
  display: "grid",
  gap: 6
};

const input: React.CSSProperties = {
  flex: 1,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.30)",
  color: "white",
  padding: "10px 12px",
  borderRadius: 12
};

const btn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 800
};

const primarySmallBtn: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(40,210,160,0.22), rgba(20,120,95,0.18))"
};

const smallBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "8px 10px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 800,
  fontSize: 12
};

const chip: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.75)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800
};

const cardStatusPill: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(0,0,0,0.22)",
  color: "rgba(255,255,255,0.78)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  display: "inline-flex",
  gap: 6,
  alignItems: "center"
};

const modalBackdrop: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.72)",
  display: "grid",
  placeItems: "center",
  padding: "calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom))",
  zIndex: 9999
};

const modalCard: React.CSSProperties = {
  width: "min(680px, 100%)",
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(10,12,16,0.92)",
  boxShadow: "0 40px 120px rgba(0,0,0,0.7)",
  padding: 14,
  display: "grid",
  gap: 12
};

const maineCard: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))",
  padding: 14
};

const seal: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 999,
  border: "1px solid rgba(40,210,160,0.35)",
  background: "rgba(40,210,160,0.12)",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  letterSpacing: -0.2,
  color: "rgba(220,255,240,0.95)",
  flex: "0 0 auto"
};

const cardRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  borderBottom: "1px dashed rgba(255,255,255,0.10)",
  paddingBottom: 8
};

const cardLabel: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.68)",
  fontWeight: 800,
  letterSpacing: 0.2
};

const cardValue: React.CSSProperties = {
  fontSize: 13,
  color: "rgba(255,255,255,0.92)",
  fontWeight: 900,
  textAlign: "right",
  wordBreak: "break-word"
};

const textarea: React.CSSProperties = {
  width: "100%",
  minHeight: 80,
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(0,0,0,0.30)",
  color: "white",
  padding: "10px 12px",
  borderRadius: 12,
  resize: "vertical"
};

const pillBase: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "rgba(255,255,255,0.78)",
  padding: "6px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  display: "inline-flex",
  gap: 6,
  alignItems: "center"
};

const pillNeutral: React.CSSProperties = {};

const pillOk: React.CSSProperties = {
  border: "1px solid rgba(40,210,160,0.24)",
  background: "rgba(40,210,160,0.08)",
  color: "rgba(220,255,240,0.92)"
};

const pillWarn: React.CSSProperties = {
  border: "1px solid rgba(255,195,80,0.24)",
  background: "rgba(255,195,80,0.08)",
  color: "rgba(255,245,220,0.92)"
};

const pillBad: React.CSSProperties = {
  border: "1px solid rgba(255,80,80,0.24)",
  background: "rgba(255,80,80,0.08)",
  color: "rgba(255,220,220,0.92)"
};

const linkBtn: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.14)",
  background: "rgba(255,255,255,0.05)",
  color: "white",
  padding: "10px 14px",
  borderRadius: 12,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800
};

const errBox: React.CSSProperties = {
  background: "rgba(255,80,80,0.10)",
  border: "1px solid rgba(255,80,80,0.25)",
  padding: 12,
  borderRadius: 12,
  color: "rgba(255,210,210,0.95)",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 12
};

const warnBox: React.CSSProperties = {
  background: "rgba(255,200,80,0.10)",
  border: "1px solid rgba(255,200,80,0.25)",
  padding: 12,
  borderRadius: 12,
  color: "rgba(255,240,210,0.95)",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  fontSize: 12
};

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  padding: "2px 6px",
  borderRadius: 10,
  border: "1px solid rgba(40,210,160,0.25)",
  background: "rgba(40,210,160,0.08)"
};
