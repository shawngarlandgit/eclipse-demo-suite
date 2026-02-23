import { arrayBufferToBase64, b64ToB64u, toArrayBuffer } from './base64';

export type MaineMedicalCardDraft = {
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
  alg: 'hkdf-sha256/aes-256-gcm';
  saltB64u: string;
  ivB64u: string;
  ctB64u: string;
};

async function deriveDraftUrlKey(sharedKey: string, salt: Uint8Array): Promise<CryptoKey> {
  const ikm = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sharedKey));
  const hkdfBase = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
  const info = toArrayBuffer(new TextEncoder().encode('cannaconnect:carddraft-url:v1'));
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info },
    hkdfBase,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function addEncryptedDraftToProviderUrl(params: {
  providerUrl: string;
  draft: MaineMedicalCardDraft;
  autoSend: boolean;
}): Promise<string> {
  const u = new URL(params.providerUrl);
  const sharedKey = u.searchParams.get('k') ?? '';
  if (!sharedKey) throw new Error('Missing shared key (k) in provider URL');

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveDraftUrlKey(sharedKey, salt);

  const plaintext = new TextEncoder().encode(JSON.stringify({ card: params.draft, autoSend: params.autoSend }));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toArrayBuffer(iv) }, key, toArrayBuffer(plaintext));

  const payload: CardDraftUrlPayloadV1 = {
    v: 1,
    alg: 'hkdf-sha256/aes-256-gcm',
    saltB64u: b64ToB64u(arrayBufferToBase64(salt.buffer)),
    ivB64u: b64ToB64u(arrayBufferToBase64(iv.buffer)),
    ctB64u: b64ToB64u(arrayBufferToBase64(ct)),
  };

  const encoded = b64ToB64u(arrayBufferToBase64(toArrayBuffer(new TextEncoder().encode(JSON.stringify(payload)))));
  u.hash = `cd=${encoded}`;
  return u.toString();
}

