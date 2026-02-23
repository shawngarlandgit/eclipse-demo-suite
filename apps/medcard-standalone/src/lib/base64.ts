export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function toArrayBuffer(view: ArrayBufferLike | ArrayBufferView): ArrayBuffer {
  if (view instanceof ArrayBuffer) return view;
  if (ArrayBuffer.isView(view)) {
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength);
  }
  return new Uint8Array(view as ArrayBufferLike).buffer;
}

export function b64ToB64u(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
