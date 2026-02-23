import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Input,
  Stack,
  Text,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { addEncryptedDraftToProviderUrl, type MaineMedicalCardDraft } from './lib/draftLink';

type Session = {
  roomId: string;
  providerToken: string;
  patientToken: string;
  sharedKey: string;
  expiresInSeconds: number;
  createdAt: number;
};

type Health = 'checking' | 'online' | 'offline';
type Event = { id: string; label: string; detail?: string; at: number };

const BRAND = {
  shell: '#1C1630',
  panel: '#2A2141',
  panelAlt: '#1F1A32',
  border: '#4B3A66',
  text: '#F6F2FF',
  muted: '#C9BDD9',
  subtle: '#A998C3',
  orange: '#F26A2E',
  orangeHover: '#E24A2A',
};

function isLoopbackHost(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(hostname);
}

function hostFromUrl(raw: string): string | null {
  try {
    return new URL(raw).hostname;
  } catch {
    return null;
  }
}

function resolveBestShareHost(runtimeHost: string, scannerRaw: string): string {
  if (runtimeHost && !isLoopbackHost(runtimeHost)) return runtimeHost;
  const scannerHost = hostFromUrl(scannerRaw);
  if (scannerHost && !isLoopbackHost(scannerHost)) return scannerHost;
  return runtimeHost || 'localhost';
}

function buildRoomUrl(base: string, s: Session, role: 'provider' | 'patient') {
  const u = new URL(`/r/${s.roomId}`, base);
  u.searchParams.set('role', role);
  u.searchParams.set('token', role === 'provider' ? s.providerToken : s.patientToken);
  u.searchParams.set('k', s.sharedKey);
  return u.toString();
}

function issuedAndExpires() {
  const d = new Date();
  const issued = d.toISOString().slice(0, 10);
  const next = new Date(d);
  next.setFullYear(next.getFullYear() + 1);
  return { issuedOn: issued, expiresOn: next.toISOString().slice(0, 10) };
}

export default function App() {
  const [scannerUrl, setScannerUrl] = useState(() => localStorage.getItem('medcard.scanner') || 'http://localhost:5182');
  const [secureWeb, setSecureWeb] = useState(() => localStorage.getItem('medcard.secureWeb') || 'http://127.0.0.1:5193');
  const [signalHttp, setSignalHttp] = useState(() => localStorage.getItem('medcard.signal') || 'http://127.0.0.1:8787');
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('medcard.adminKey') || '');

  const [session, setSession] = useState<Session | null>(null);
  const [providerDraftUrl, setProviderDraftUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [health, setHealth] = useState<{ scanner: Health; secureWeb: Health; signaling: Health }>({
    scanner: 'checking', secureWeb: 'checking', signaling: 'checking'
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registryId, setRegistryId] = useState('');

  const secureWebHost = useMemo(() => hostFromUrl(secureWeb), [secureWeb]);
  const hasLoopbackSecureWeb = useMemo(() => {
    return secureWebHost ? isLoopbackHost(secureWebHost) : true;
  }, [secureWebHost]);

  const isShareableHost = useMemo(() => {
    try {
      const u = new URL(secureWeb);
      return !isLoopbackHost(u.hostname);
    } catch {
      return false;
    }
  }, [secureWeb]);

  function log(label: string, detail?: string) {
    setEvents((prev) => [{ id: crypto.randomUUID(), label, detail, at: Date.now() }, ...prev].slice(0, 12));
  }

  useEffect(() => {
    localStorage.setItem('medcard.scanner', scannerUrl.trim());
    localStorage.setItem('medcard.secureWeb', secureWeb.trim());
    localStorage.setItem('medcard.signal', signalHttp.trim());
    localStorage.setItem('medcard.adminKey', adminKey.trim());
  }, [scannerUrl, secureWeb, signalHttp, adminKey]);

  useEffect(() => {
    // If user opened medcard via LAN IP, auto-suggest LAN service URLs instead of loopback.
    const runtimeHost = window.location.hostname;
    if (!runtimeHost || isLoopbackHost(runtimeHost)) return;

    const currentSecureHost = hostFromUrl(secureWeb);
    const currentScannerHost = hostFromUrl(scannerUrl);
    const currentSignalHost = hostFromUrl(signalHttp);
    const shouldUpgrade =
      (currentSecureHost && isLoopbackHost(currentSecureHost)) ||
      (currentScannerHost && isLoopbackHost(currentScannerHost)) ||
      (currentSignalHost && isLoopbackHost(currentSignalHost));

    if (!shouldUpgrade) return;

    setSecureWeb((prev) => {
      const p = prev.trim();
      if (!p) return `http://${runtimeHost}:5193`;
      try {
        const u = new URL(p);
        if (!isLoopbackHost(u.hostname)) return prev;
        u.hostname = runtimeHost;
        u.port = '5193';
        return u.toString();
      } catch {
        return `http://${runtimeHost}:5193`;
      }
    });
    setScannerUrl((prev) => {
      const p = prev.trim();
      if (!p) return `http://${runtimeHost}:5182`;
      try {
        const u = new URL(p);
        if (!isLoopbackHost(u.hostname)) return prev;
        u.hostname = runtimeHost;
        u.port = '5182';
        return u.toString();
      } catch {
        return `http://${runtimeHost}:5182`;
      }
    });
    setSignalHttp((prev) => {
      const p = prev.trim();
      if (!p) return `http://${runtimeHost}:8787`;
      try {
        const u = new URL(p);
        if (!isLoopbackHost(u.hostname)) return prev;
        u.hostname = runtimeHost;
        u.port = '8787';
        return u.toString();
      } catch {
        return `http://${runtimeHost}:8787`;
      }
    });
    log('Auto-detected LAN host', runtimeHost);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancel = false;
    async function ping(url: string, sameOrigin = false) {
      try {
        await fetch(url, { method: 'GET', mode: sameOrigin ? 'same-origin' : 'no-cors', cache: 'no-store' });
        return true;
      } catch {
        return false;
      }
    }
    async function run() {
      setHealth({ scanner: 'checking', secureWeb: 'checking', signaling: 'checking' });
      const [scannerOk, webOk, sigOk] = await Promise.all([
        ping(scannerUrl),
        ping(secureWeb),
        ping(`${signalHttp.replace(/\/$/, '')}/health`),
      ]);
      if (cancel) return;
      setHealth({
        scanner: scannerOk ? 'online' : 'offline',
        secureWeb: webOk ? 'online' : 'offline',
        signaling: sigOk ? 'online' : 'offline',
      });
    }
    void run();
    const t = window.setInterval(() => void run(), 10000);
    return () => { cancel = true; window.clearInterval(t); };
  }, [scannerUrl, secureWeb, signalHttp]);

  async function createSession() {
    setBusy(true);
    setError(null);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (adminKey.trim()) headers['x-admin-key'] = adminKey.trim();
      const res = await fetch(`${signalHttp.replace(/\/$/, '')}/api/rooms`, { method: 'POST', headers, body: '{}' });
      if (!res.ok) throw new Error(`Create session failed (${res.status})`);
      const s = (await res.json()) as Omit<Session, 'createdAt'>;
      const created: Session = { ...s, createdAt: Date.now() };
      setSession(created);
      setProviderDraftUrl('');
      log('Session created', created.roomId);
      return created;
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? 'Failed creating session');
      setError(msg);
      log('Session create failed', msg);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createAndCopyProviderDraft() {
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !dob.trim()) {
      setError('First name, last name, and DOB are required.');
      return;
    }
    const s = session ?? (await createSession());
    if (!s) return;

    try {
      const providerUrl = buildRoomUrl(secureWeb, s, 'provider');
      const { issuedOn, expiresOn } = issuedAndExpires();
      const draft: MaineMedicalCardDraft = {
        id: crypto.randomUUID(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        phone: phone.trim(),
        email: email.trim(),
        issuedOn,
        expiresOn,
        registryId: registryId.trim(),
      };
      const url = await addEncryptedDraftToProviderUrl({ providerUrl, draft, autoSend: false });
      setProviderDraftUrl(url);
      await navigator.clipboard.writeText(url);
      log('Provider draft link copied');
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? 'Failed building provider draft link');
      setError(msg);
      log('Provider draft failed', msg);
    }
  }

  const patientUrl = session ? buildRoomUrl(secureWeb, session, 'patient') : '';

  function ensureShareUrlFromScannerClick(): string {
    const runtimeHost = window.location.hostname;
    const bestHost = resolveBestShareHost(runtimeHost, scannerUrl);
    let nextUrl = '';
    setSecureWeb((prev) => {
      const raw = prev.trim();
      if (!raw) {
        nextUrl = `http://${bestHost}:5193`;
        return nextUrl;
      }
      try {
        const u = new URL(raw);
        if (!isLoopbackHost(u.hostname)) {
          nextUrl = prev;
          return prev;
        }
        u.hostname = bestHost;
        u.port = '5193';
        nextUrl = u.toString();
        return nextUrl;
      } catch {
        nextUrl = `http://${bestHost}:5193`;
        return nextUrl;
      }
    });
    return nextUrl || secureWeb.trim() || `http://${bestHost}:5193`;
  }

  return (
    <Box minH="100vh" bg={`linear-gradient(135deg, ${BRAND.shell} 0%, #251B3A 55%, #191427 100%)`} color={BRAND.text} p={{ base: 4, md: 6 }}>
      <Stack maxW="980px" mx="auto" spacing={4}>
        <Heading size="lg">Eclipse Med Card + Secure Call</Heading>
        <Text color={BRAND.muted}>Quick and efficient: scan, create/send, share patient link.</Text>

        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Wrap spacing={2}>
            <Badge>Scanner: {health.scanner}</Badge>
            <Badge>Secure Web: {health.secureWeb}</Badge>
            <Badge>Signaling: {health.signaling}</Badge>
          </Wrap>
          <Grid mt={3} gap={3} templateColumns={{ base: '1fr', md: '1fr 1fr' }}>
            <FormControl>
              <FormLabel color={BRAND.muted}>Mobile Scanner URL</FormLabel>
              <Input value={scannerUrl} onChange={(e) => setScannerUrl(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            </FormControl>
            <FormControl>
              <FormLabel color={BRAND.muted}>Secure Call Public Web URL</FormLabel>
              <Input value={secureWeb} onChange={(e) => setSecureWeb(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            </FormControl>
            <FormControl>
              <FormLabel color={BRAND.muted}>Signaling HTTP URL</FormLabel>
              <Input value={signalHttp} onChange={(e) => setSignalHttp(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            </FormControl>
            <FormControl>
              <FormLabel color={BRAND.muted}>Admin Key (optional)</FormLabel>
              <Input value={adminKey} onChange={(e) => setAdminKey(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            </FormControl>
          </Grid>
        </Box>

        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Heading size="sm">Step 1: Med Card Details</Heading>
          <Grid mt={3} gap={3} templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }}>
            <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            <Input placeholder="DOB (YYYY-MM-DD)" value={dob} onChange={(e) => setDob(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            <Input placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
            <Input placeholder="Registry ID (optional)" value={registryId} onChange={(e) => setRegistryId(e.target.value)} bg={BRAND.panelAlt} borderColor={BRAND.border} />
          </Grid>
          <HStack mt={3} spacing={3} flexWrap="wrap">
            <Button
              bg={BRAND.orange}
              color="white"
              _hover={{ bg: BRAND.orangeHover }}
              onClick={() => {
                const resolvedSecureWeb = ensureShareUrlFromScannerClick();
                log('Scanner opened');
                try {
                  const target = new URL(scannerUrl.trim() || 'http://localhost:5182');
                  target.searchParams.set('secureWebUrl', resolvedSecureWeb);
                  if (signalHttp.trim()) target.searchParams.set('signalingHttp', signalHttp.trim());
                  window.open(target.toString(), '_blank', 'noopener,noreferrer');
                } catch {
                  window.open(scannerUrl || undefined, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              1) Open Scanner
            </Button>
            <Button variant="outline" borderColor={BRAND.border} onClick={() => void createSession()} isLoading={busy}>
              2) Create Session
            </Button>
            <Button bg={BRAND.orange} color="white" _hover={{ bg: BRAND.orangeHover }} onClick={() => void createAndCopyProviderDraft()} isLoading={busy}>
              3) Create + Copy Provider Draft Link
            </Button>
          </HStack>
        </Box>

        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Heading size="sm">Share & Launch</Heading>
          <HStack mt={3} spacing={3} flexWrap="wrap">
            <Button as="a" href={providerDraftUrl || undefined} target="_blank" rel="noreferrer" variant="outline" borderColor={BRAND.border} isDisabled={!providerDraftUrl}>
              Open Provider
            </Button>
            <Button as="a" href={patientUrl || undefined} target="_blank" rel="noreferrer" variant="outline" borderColor={BRAND.border} isDisabled={!patientUrl}>
              Open Patient
            </Button>
            <Button
              bg={BRAND.orange}
              color="white"
              _hover={{ bg: BRAND.orangeHover }}
              isDisabled={!patientUrl || !isShareableHost}
              onClick={async () => {
                const host = hostFromUrl(patientUrl);
                if (!host || isLoopbackHost(host)) {
                  setError('Share link blocked: replace localhost/127.0.0.1 with LAN IP or HTTPS public URL.');
                  log('Blocked non-shareable patient link', patientUrl);
                  return;
                }
                await navigator.clipboard.writeText(patientUrl);
                log('Shareable patient link copied');
              }}
            >
              Copy Shareable Patient Link
            </Button>
          </HStack>
          {!isShareableHost ? (
            <Text color="#FFD6BE" fontSize="xs" mt={2}>Share blocked for localhost/127.0.0.1. Use LAN IP (same Wi-Fi) or HTTPS public URL.</Text>
          ) : null}
          {hasLoopbackSecureWeb ? (
            <Text color="#FFD6BE" fontSize="xs" mt={1}>Current Secure Web URL is loopback and only works on this device.</Text>
          ) : null}
          {session ? <Text mt={2} color={BRAND.subtle} fontSize="xs">Room: {session.roomId}</Text> : null}
        </Box>

        {error ? (
          <Box bg="#4B2630" border="1px solid" borderColor="#A44A5A" borderRadius="md" p={3}>
            <Text color="#FFD2DA" fontSize="sm">{error}</Text>
          </Box>
        ) : null}

        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Heading size="sm">Timeline</Heading>
          {events.length === 0 ? (
            <Text color={BRAND.subtle} mt={2} fontSize="sm">No events yet.</Text>
          ) : (
            <VStack align="stretch" mt={3} spacing={2}>
              {events.map((e) => (
                <Box key={e.id} bg={BRAND.panelAlt} border="1px solid" borderColor={BRAND.border} borderRadius="md" p={2}>
                  <Text fontSize="sm" fontWeight="bold">{e.label}</Text>
                  {e.detail ? <Text fontSize="xs" color={BRAND.muted}>{e.detail}</Text> : null}
                  <Text fontSize="xs" color={BRAND.subtle}>{new Date(e.at).toLocaleTimeString()}</Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
