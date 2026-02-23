const WORDS = [
  "able","acid","aged","also","area","army","axis","back","bake","ball","band","bank","base","beam","bird","bold","both","bulk","calm","camp","card",
  "cash","cast","chat","chef","city","clay","code","coil","cold","come","core","crew","crop","dark","data","dawn","desk","dial","dirt","dose","down",
  "draw","drop","each","earn","east","easy","echo","edge","else","envy","ever","fact","fair","farm","fast","feed","file","film","find","fire","fish",
  "flag","flex","flow","food","fork","form","fuel","gain","gate","gear","gift","goal","gold","good","grow","half","hand","hard","hash","have","heat",
  "help","hero","high","hold","home","hook","host","idea","iron","item","join","jolt","keep","kind","kite","knee","know","lamb","lane","last","late",
  "lead","leaf","left","lens","life","lift","link","list","live","load","lock","loop","loud","main","make","many","mass","math","meet","melt","menu",
  "mild","mint","mode","moon","more","move","much","name","near","next","note","open","pack","page","pain","pair","park","peak","peer","pick","pine",
  "pipe","plan","play","port","pull","pure","push","quad","quiz","race","rail","rain","rare","read","real","reed","rest","rice","ride","ring","rise",
  "road","role","root","safe","salt","same","scan","seal","seed","send","ship","shop","show","side","sign","sink","site","size","skip","snow","sock",
  "soft","solo","song","spot","star","stay","step","swim","sync","task","team","time","tool","tune","turn","unit","user","vast","view","wait","wave",
  "weak","wide","wish","work","year","zero"
];

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verificationCode(params: {
  sharedKey: string;
  localFingerprint: string;
  remoteFingerprint: string;
}): Promise<string> {
  const a = params.localFingerprint.toLowerCase();
  const b = params.remoteFingerprint.toLowerCase();
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  const hex = await sha256Hex(`${params.sharedKey}|${pair}`);
  const n0 = parseInt(hex.slice(0, 4), 16) % WORDS.length;
  const n1 = parseInt(hex.slice(4, 8), 16) % WORDS.length;
  const n2 = parseInt(hex.slice(8, 12), 16) % WORDS.length;
  return `${WORDS[n0]} ${WORDS[n1]} ${WORDS[n2]}`;
}

// --- File E2EE (v1) ---
// Best-effort browser-native implementation:
// - ECDH P-256 key agreement (widely supported)
// - HKDF-SHA256 -> AES-256-GCM
//
// This provides application-layer encryption for file chunks sent over WebRTC.

export function randomBytes(len: number): Uint8Array {
  const out = new Uint8Array(len);
  crypto.getRandomValues(out);
  return out;
}

function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  // DOM lib types sometimes distinguish ArrayBuffer vs SharedArrayBuffer.
  // Copy into a fresh ArrayBuffer to satisfy WebCrypto's BufferSource types.
  const out = new Uint8Array(u8.byteLength);
  out.set(u8);
  return out.buffer;
}

export async function generateEcdhKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
}

export async function exportPublicKeyJwk(publicKey: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", publicKey);
}

export async function importPeerPublicKeyJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

export async function deriveFileAesKey(params: {
  privateKey: CryptoKey;
  peerPublicKey: CryptoKey;
  salt: Uint8Array;
  info?: string;
}): Promise<CryptoKey> {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: params.peerPublicKey },
    params.privateKey,
    256
  );

  const hkdfBase = await crypto.subtle.importKey("raw", sharedBits, "HKDF", false, ["deriveKey"]);
  const info = toArrayBuffer(new TextEncoder().encode(params.info ?? "cannaconnect-secure-call:file-e2ee:v1"));
  const salt = toArrayBuffer(params.salt);

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    hkdfBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export function makeIv(prefix4: Uint8Array, seq: number): Uint8Array {
  // 12-byte IV: 4 bytes random prefix + 8 bytes big-endian counter
  if (prefix4.byteLength !== 4) throw new Error("prefix must be 4 bytes");
  const iv = new Uint8Array(12);
  iv.set(prefix4, 0);
  const view = new DataView(iv.buffer);
  // write BigUint64 at offset 4
  view.setBigUint64(4, BigInt(seq), false);
  return iv;
}

export async function aesGcmEncrypt(params: {
  key: CryptoKey;
  iv: Uint8Array;
  plaintext: ArrayBuffer;
  aad?: Uint8Array;
}): Promise<ArrayBuffer> {
  const iv = toArrayBuffer(params.iv);
  const aad = params.aad ? toArrayBuffer(params.aad) : undefined;
  const algorithm = aad
    ? { name: "AES-GCM", iv, additionalData: aad }
    : { name: "AES-GCM", iv };
  return crypto.subtle.encrypt(algorithm, params.key, params.plaintext);
}

export async function aesGcmDecrypt(params: {
  key: CryptoKey;
  iv: Uint8Array;
  ciphertext: ArrayBuffer;
  aad?: Uint8Array;
}): Promise<ArrayBuffer> {
  const iv = toArrayBuffer(params.iv);
  const aad = params.aad ? toArrayBuffer(params.aad) : undefined;
  const algorithm = aad
    ? { name: "AES-GCM", iv, additionalData: aad }
    : { name: "AES-GCM", iv };
  return crypto.subtle.decrypt(algorithm, params.key, params.ciphertext);
}
