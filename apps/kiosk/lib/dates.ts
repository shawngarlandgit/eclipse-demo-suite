export function ymd(d: Date | null): string {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function defaultIssuedAndExpires(): { issuedOn: string; expiresOn: string } {
  const today = new Date();
  const issuedOn = ymd(today);
  const expires = new Date(today);
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresOn = ymd(expires);
  return { issuedOn, expiresOn };
}
