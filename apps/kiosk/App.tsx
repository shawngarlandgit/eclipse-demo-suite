import { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Pdf417Scanner } from './components/Pdf417Scanner';
import type { ParsedLicenseData } from './lib/parseDriverLicense';
import { defaultIssuedAndExpires, ymd } from './lib/dates';
import type { MaineMedicalCardDraft } from './lib/draftLink';
import { addEncryptedDraftToProviderUrl } from './lib/draftLink';

type CreateRoomResponse = {
  roomId: string;
  providerToken: string;
  patientToken: string;
  sharedKey: string;
  expiresInSeconds: number;
};

function buildRoomUrl(args: {
  webBaseUrl: string;
  roomId: string;
  role: 'provider' | 'patient';
  token: string;
  sharedKey: string;
}) {
  const u = new URL(`/r/${args.roomId}`, args.webBaseUrl);
  u.searchParams.set('role', args.role);
  u.searchParams.set('token', args.token);
  u.searchParams.set('k', args.sharedKey);
  return u.toString();
}

function buildCardDraftFromLicense(lic: ParsedLicenseData, phone: string, email: string): MaineMedicalCardDraft {
  const { issuedOn, expiresOn } = defaultIssuedAndExpires();
  return {
    id: crypto.randomUUID(),
    firstName: lic.firstName ?? '',
    lastName: lic.lastName ?? '',
    dob: ymd(lic.dateOfBirth),
    phone,
    email,
    issuedOn,
    expiresOn,
    registryId: '',
  };
}

export default function App() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [step, setStep] = useState<'scan' | 'details' | 'ready'>('scan');
  const [license, setLicense] = useState<ParsedLicenseData | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);

  const [secureCallWebUrl, setSecureCallWebUrl] = useState<string>(
    query.get('secureWebUrl') ?? (import.meta.env.VITE_SECURE_CALL_WEB_URL as string | undefined) ?? ''
  );
  const signalingHttp = query.get('signalingHttp') ?? (import.meta.env.VITE_SIGNALING_HTTP as string | undefined) ?? '';
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [patientUrl, setPatientUrl] = useState<string>('');
  const [providerUrl, setProviderUrl] = useState<string>('');

  const draft = useMemo(() => {
    if (!license) return null;
    return buildCardDraftFromLicense(license, phone.trim(), email.trim());
  }, [license, phone, email]);

  async function createSession() {
    setErr(null);
    if (!draft) return;
    if (!consent) {
      setErr('Consent is required.');
      return;
    }
    if (!secureCallWebUrl.trim()) {
      setErr('Set Secure Call Web URL (HTTPS) first.');
      return;
    }

    setCreating(true);
    try {
      const apiBase = signalingHttp.trim() || secureCallWebUrl.trim();
      const apiUrl = new URL('/api/rooms', apiBase).toString();
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const hint =
          res.status === 405
            ? ' Your signaling API is not reachable at /api/rooms. Set VITE_SIGNALING_HTTP (recommended) or use a single-origin tunnel in dev.'
            : '';
        throw new Error(`Create session failed (${res.status}): ${text || res.statusText}.${hint}`);
      }
      const data = (await res.json()) as CreateRoomResponse;

      const base = secureCallWebUrl.trim();
      const patient = buildRoomUrl({ webBaseUrl: base, roomId: data.roomId, role: 'patient', token: data.patientToken, sharedKey: data.sharedKey });
      const providerBase = buildRoomUrl({ webBaseUrl: base, roomId: data.roomId, role: 'provider', token: data.providerToken, sharedKey: data.sharedKey });

      // Kiosk intent: provider reviews first, so autoSend=false.
      const providerWithDraft = await addEncryptedDraftToProviderUrl({ providerUrl: providerBase, draft, autoSend: false });

      setPatientUrl(patient);
      setProviderUrl(providerWithDraft);
      setStep('ready');
    } catch (e: any) {
      setErr(String(e?.message ?? e ?? 'Unknown error'));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={page}>
      <div style={shell}>
        <div style={topbar}>
          <div style={{ display: 'grid', gap: 2 }}>
            <div style={{ fontWeight: 900, letterSpacing: -0.3 }}>CannaConnect Kiosk</div>
            <div style={{ fontSize: 12, opacity: 0.72 }}>Scan ID, capture consent, then hand off to provider for review.</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              style={pillBtn}
              onClick={() => {
                setStep('scan');
                setLicense(null);
                setPhone('');
                setEmail('');
                setConsent(false);
                setPatientUrl('');
                setProviderUrl('');
                setErr(null);
              }}
            >
              New Intake
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={cardTitle}>Secure Call Web URL</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Must be HTTPS for iPhone/iPad camera and mic (use a tunnel or deploy).
          </div>
          <input
            style={input}
            placeholder="https://...trycloudflare.com"
            value={secureCallWebUrl}
            onChange={(e) => setSecureCallWebUrl(e.target.value)}
          />
        </div>

        {err ? <div style={errBox}>{err}</div> : null}

        {step === 'scan' ? (
          <div style={card}>
            <div style={cardTitle}>Step 1: Scan Patient ID</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              Scan the PDF417 barcode on the back.
            </div>
            <div style={{ marginTop: 12 }}>
              <Pdf417Scanner
                minimumAge={18}
                onScan={(d) => {
                  setLicense(d);
                  setStep('details');
                }}
                onError={(m) => setErr(m)}
              />
            </div>
          </div>
        ) : null}

        {step === 'details' && license ? (
          <div style={card}>
            <div style={cardTitle}>Step 2: Confirm Details + Consent</div>
            <div style={grid2}>
              <div style={field}>
                <div style={label}>Name</div>
                <div style={value}>{license.fullName || `${license.firstName} ${license.lastName}`}</div>
              </div>
              <div style={field}>
                <div style={label}>DOB</div>
                <div style={value}>{ymd(license.dateOfBirth)}</div>
              </div>
              <div style={field}>
                <div style={label}>License #</div>
                <div style={value}>{license.licenseNumber || '—'}</div>
              </div>
              <div style={field}>
                <div style={label}>Age</div>
                <div style={value}>{license.age ?? '—'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              <input style={input} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input style={input} placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} />

              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, opacity: 0.9 }}>
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span>
                  I consent to a telemedicine evaluation and to sharing my ID and intake information with the provider for certification.
                </span>
              </label>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button style={btn} onClick={() => setStep('scan')}>
                  Re-Scan
                </button>
                <button style={btnPrimary} onClick={() => void createSession()} disabled={creating}>
                  {creating ? 'Creating…' : 'Create Session'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {step === 'ready' ? (
          <div style={card}>
            <div style={cardTitle}>Step 3: Hand Off To Provider</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4, lineHeight: 1.4 }}>
              Staff/provider opens the provider link below. It includes the scanned details as an encrypted draft so the provider can review and then send the draft to the patient.
            </div>

            <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
              <div style={qrRow}>
                <div style={qrBox}>
                  <QRCodeCanvas value={providerUrl || ' '} size={180} includeMargin />
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Provider QR</div>
                </div>
                <div style={{ display: 'grid', gap: 10, flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>Provider link</div>
                  <div style={monoBox}>{providerUrl}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      style={btn}
                      onClick={async () => {
                        await navigator.clipboard.writeText(providerUrl);
                      }}
                    >
                      Copy Provider
                    </button>
                    <button style={btnPrimary} onClick={() => window.open(providerUrl, '_blank')}>
                      Open Provider
                    </button>
                  </div>
                </div>
              </div>

              <div style={divider} />

              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>Patient link (this device or patient phone)</div>
                <div style={monoBox}>{patientUrl}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    style={btn}
                    onClick={async () => {
                      await navigator.clipboard.writeText(patientUrl);
                    }}
                  >
                    Copy Patient
                  </button>
                  <button style={btnPrimary} onClick={() => (window.location.href = patientUrl)}>
                    Join As Patient
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div style={{ fontSize: 12, opacity: 0.55, textAlign: 'center', padding: '10px 0 2px' }}>
          v0 kiosk, local-only dev assumptions. Deploy behind HTTPS for camera/mic.
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = {
  minHeight: '100svh',
  background:
    'radial-gradient(1200px 700px at 20% 0%, rgba(34,197,94,0.12), transparent 60%), radial-gradient(900px 700px at 80% 10%, rgba(59,130,246,0.10), transparent 55%), #07090c',
  padding: 16,
};

const shell: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
  display: 'grid',
  gap: 12,
};

const topbar: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: '10px 12px',
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
};

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 14,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
};

const cardTitle: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: -0.2,
};

const input: React.CSSProperties = {
  marginTop: 10,
  width: '100%',
  padding: '12px 12px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.12)',
  outline: 'none',
  background: 'rgba(0,0,0,0.25)',
  color: '#fff',
  fontSize: 14,
};

const btn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: 'rgba(34,197,94,0.18)',
  border: '1px solid rgba(34,197,94,0.45)',
};

const pillBtn: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const errBox: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(248,113,113,0.35)',
  background: 'rgba(248,113,113,0.10)',
  color: 'rgba(254,202,202,0.95)',
  fontWeight: 700,
};

const grid2: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 10,
  marginTop: 12,
};

const field: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(0,0,0,0.22)',
};

const label: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.65,
};

const value: React.CSSProperties = {
  marginTop: 4,
  fontWeight: 900,
  letterSpacing: -0.2,
};

const qrRow: React.CSSProperties = {
  display: 'flex',
  gap: 14,
  alignItems: 'stretch',
  flexWrap: 'wrap',
};

const qrBox: React.CSSProperties = {
  padding: 10,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(0,0,0,0.22)',
  textAlign: 'center',
};

const monoBox: React.CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 12,
  padding: 10,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(0,0,0,0.22)',
  overflow: 'auto',
  maxWidth: '100%',
};

const divider: React.CSSProperties = {
  height: 1,
  background: 'rgba(255,255,255,0.10)',
};
