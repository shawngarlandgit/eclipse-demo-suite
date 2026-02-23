import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Pdf417Scanner } from '../components/id/Pdf417Scanner';
import type { ParsedLicenseData } from '../modules/inventory/order-flow/utils/parseDriverLicense';
import { addEncryptedDraftToProviderUrl, type MaineMedicalCardDraft } from '../features/secure-call/draftLink';

type CreateRoomResponse = {
  roomId: string;
  providerToken: string;
  patientToken: string;
  sharedKey: string;
  expiresInSeconds: number;
};

type Session = CreateRoomResponse & {
  createdAt: number;
};
type HealthStatus = 'checking' | 'online' | 'offline';
type FlowEvent = {
  id: string;
  at: number;
  label: string;
  detail?: string;
};

const LS_WEB_URL = 'cannaconnect.secure_call.web_url.v1';
const LS_ADMIN_KEY = 'cannaconnect.secure_call.admin_key.v1';
const LS_SESSIONS = 'cannaconnect.secure_call.sessions.v1';
const LS_KIOSK_URL = 'cannaconnect.secure_call.kiosk_url.v1';
const MED_CARD_LAUNCH_CMD = 'npm run dev:medcard';
const BRAND = {
  shell: '#1C1630',
  panel: '#2A2141',
  panelAlt: '#1F1A32',
  border: '#4B3A66',
  borderStrong: '#5E4A7D',
  text: '#F6F2FF',
  textMuted: '#C9BDD9',
  textSubtle: '#A998C3',
  orange: '#F26A2E',
  orangeHover: '#E24A2A',
};

function ymd(d: Date | null): string {
  if (!d) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultIssuedAndExpires(): { issuedOn: string; expiresOn: string } {
  const today = new Date();
  const issuedOn = ymd(today);
  const expires = new Date(today);
  expires.setFullYear(expires.getFullYear() + 1);
  const expiresOn = ymd(expires);
  return { issuedOn, expiresOn };
}

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

function buildDraftFromLicense(lic: ParsedLicenseData, extra: { phone: string; email: string; registryId: string }): MaineMedicalCardDraft {
  const { issuedOn, expiresOn } = defaultIssuedAndExpires();
  return {
    id: crypto.randomUUID(),
    firstName: lic.firstName ?? '',
    lastName: lic.lastName ?? '',
    dob: ymd(lic.dateOfBirth),
    phone: extra.phone,
    email: extra.email,
    issuedOn,
    expiresOn,
    registryId: extra.registryId,
  };
}

export default function SecureCallsPage() {
  const navigate = useNavigate();
  const [secureCallWebUrl, setSecureCallWebUrl] = useState<string>(() => {
    const fromEnv = (import.meta.env.VITE_SECURE_CALL_WEB_URL as string | undefined) ?? '';
    const fromLs = typeof window !== 'undefined' ? window.localStorage.getItem(LS_WEB_URL) : null;
    return (fromLs ?? fromEnv).trim() || 'http://127.0.0.1:5193';
  });
  const [adminKey, setAdminKey] = useState<string>(() => {
    const fromLs = typeof window !== 'undefined' ? window.localStorage.getItem(LS_ADMIN_KEY) : null;
    return (fromLs ?? '').trim();
  });
  const [kioskAppUrl, setKioskAppUrl] = useState<string>(() => {
    const fromEnv = (import.meta.env.VITE_KIOSK_APP_URL as string | undefined) ?? '';
    const fromLs = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KIOSK_URL) : null;
    const raw = (fromLs ?? fromEnv).trim();
    if (!raw) return 'http://localhost:5182';
    if (raw === 'http://127.0.0.1:5173' || raw === 'http://localhost:5173') return 'http://localhost:5182';
    return raw;
  });

  const [sessions, setSessions] = useState<Session[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LS_SESSIONS) : null;
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Session[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((s) => s && typeof s.roomId === 'string' && typeof s.sharedKey === 'string');
    } catch {
      return [];
    }
  });

  const latest = sessions[0] ?? null;
  const secureCallUrlLooksLocal = useMemo(() => {
    const raw = secureCallWebUrl.trim();
    if (!raw) return false;
    try {
      const parsed = new URL(raw);
      return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
    } catch {
      return false;
    }
  }, [secureCallWebUrl]);
  const secureCallUrlIsPublic = useMemo(() => {
    const raw = secureCallWebUrl.trim();
    if (!raw) return false;
    try {
      const parsed = new URL(raw);
      return parsed.protocol === 'https:' && !['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
    } catch {
      return false;
    }
  }, [secureCallWebUrl]);

  useEffect(() => {
    window.localStorage.setItem(LS_WEB_URL, secureCallWebUrl.trim());
  }, [secureCallWebUrl]);

  useEffect(() => {
    window.localStorage.setItem(LS_ADMIN_KEY, adminKey.trim());
  }, [adminKey]);

  useEffect(() => {
    window.localStorage.setItem(LS_KIOSK_URL, kioskAppUrl.trim());
  }, [kioskAppUrl]);

  useEffect(() => {
    window.localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions.slice(0, 50)));
  }, [sessions]);

  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [health, setHealth] = useState<{ scanner: HealthStatus; signaling: HealthStatus; secureWeb: HealthStatus }>({
    scanner: 'checking',
    signaling: 'checking',
    secureWeb: 'checking',
  });
  const [flowEvents, setFlowEvents] = useState<FlowEvent[]>([]);

  function pushFlowEvent(label: string, detail?: string) {
    setFlowEvents((prev) => [{ id: crypto.randomUUID(), at: Date.now(), label, detail }, ...prev].slice(0, 10));
  }

  async function createSession(): Promise<Session | null> {
    setErr(null);
    setCreating(true);
    try {
      const headers: Record<string, string> = { 'content-type': 'application/json' };
      if (adminKey.trim()) headers['x-admin-key'] = adminKey.trim();

      const fromEnv = ((import.meta.env.VITE_SIGNALING_HTTP as string | undefined) ?? '').trim();
      // Prefer same-origin proxy from admin dashboard to avoid CORS failures in local dev.
      const apiUrl = fromEnv ? new URL('/api/rooms', fromEnv).toString() : '/secure-call-api/api/rooms';

      const res = await fetch(apiUrl, { method: 'POST', headers, body: '{}' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const hint =
          res.status === 405
            ? ' This demo is static. Point Secure Call Web URL at a dev tunnel (recommended) or set VITE_SIGNALING_HTTP to a deployed signaling server.'
            : '';
        throw new Error(`Create session failed (${res.status}): ${text || res.statusText}.${hint}`);
      }
      const data = (await res.json()) as CreateRoomResponse;
      const s: Session = { ...data, createdAt: Date.now() };
      setSessions((prev) => [s, ...prev].slice(0, 50));
      pushFlowEvent('Session created', s.roomId);
      return s;
    } catch (e: any) {
      setErr(String(e?.message ?? e ?? 'Unknown error'));
      pushFlowEvent('Session create failed', String(e?.message ?? e ?? 'Unknown error'));
      return null;
    } finally {
      setCreating(false);
    }
  }

  function sessionUrls(s: Session): { providerUrl: string; patientUrl: string } {
    const base = secureCallWebUrl.trim();
    if (!base) return { providerUrl: '', patientUrl: '' };
    return {
      providerUrl: buildRoomUrl({ webBaseUrl: base, roomId: s.roomId, role: 'provider', token: s.providerToken, sharedKey: s.sharedKey }),
      patientUrl: buildRoomUrl({ webBaseUrl: base, roomId: s.roomId, role: 'patient', token: s.patientToken, sharedKey: s.sharedKey }),
    };
  }

  // Scan ID modal state (per selected session)
  const scanModal = useDisclosure();
  const [scanSession, setScanSession] = useState<Session | null>(null);
  const [scanned, setScanned] = useState<ParsedLicenseData | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [registryId, setRegistryId] = useState('');
  const [providerWithDraft, setProviderWithDraft] = useState<string>('');
  const [scanErr, setScanErr] = useState<string | null>(null);

  const draft = useMemo(() => {
    if (!scanned) return null;
    return buildDraftFromLicense(scanned, { phone: phone.trim(), email: email.trim(), registryId: registryId.trim() });
  }, [scanned, phone, email, registryId]);

  async function openScanFor(s?: Session) {
    setScanErr(null);
    setScanSession(s ?? null);
    setScanned(null);
    setProviderWithDraft('');
    setPhone('');
    setEmail('');
    setRegistryId('');
    pushFlowEvent('Scanner opened');
    scanModal.onOpen();
  }

  async function buildProviderDraftLink() {
    setScanErr(null);
    if (!draft) return;
    let targetSession = scanSession;
    if (!targetSession) {
      const created = await createSession();
      if (!created) {
        setScanErr('Could not create secure session.');
        return;
      }
      targetSession = created;
      setScanSession(created);
    }
    const baseUrls = sessionUrls(targetSession);
    if (!baseUrls.providerUrl) {
      setScanErr('Set Secure Call Web URL (HTTPS) first.');
      return;
    }
    try {
      const url = await addEncryptedDraftToProviderUrl({
        providerUrl: baseUrls.providerUrl,
        draft,
        autoSend: false,
      });
      setProviderWithDraft(url);
      pushFlowEvent('Draft linked to provider', targetSession.roomId);
    } catch (e: any) {
      setScanErr(String(e?.message ?? e ?? 'Failed to build provider draft link'));
      pushFlowEvent('Draft link failed', String(e?.message ?? e ?? 'Unknown error'));
    }
  }

  async function checkReachable(url: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 2500);
      const isAbsolute = /^https?:\/\//i.test(url);
      await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        mode: isAbsolute ? 'no-cors' : 'same-origin',
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      return true;
    } catch {
      return false;
    }
  }

  useEffect(() => {
    let cancelled = false;
    const fromEnv = ((import.meta.env.VITE_SIGNALING_HTTP as string | undefined) ?? '').trim();
    const signalingHealth = fromEnv ? new URL('/health', fromEnv).toString() : '/secure-call-api/health';

    const run = async () => {
      setHealth((prev) => ({ ...prev, scanner: 'checking', signaling: 'checking', secureWeb: 'checking' }));
      const [scannerOk, signalingOk, webOk] = await Promise.all([
        checkReachable(kioskAppUrl.trim()),
        checkReachable(signalingHealth),
        checkReachable(secureCallWebUrl.trim()),
      ]);
      if (cancelled) return;
      setHealth({
        scanner: scannerOk ? 'online' : 'offline',
        signaling: signalingOk ? 'online' : 'offline',
        secureWeb: webOk ? 'online' : 'offline',
      });
    };

    void run();
    const timer = window.setInterval(() => void run(), 10000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [kioskAppUrl, secureCallWebUrl]);

  const latestUrls = latest ? sessionUrls(latest) : { providerUrl: '', patientUrl: '' };

  return (
    <Box
      bg={`linear-gradient(135deg, ${BRAND.shell} 0%, #251B3A 52%, #191427 100%)`}
      border="1px solid"
      borderColor={BRAND.border}
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
    >
      <Flex align="start" justify="space-between" gap={4} flexWrap="wrap">
        <Box>
          <Heading size="lg" color={BRAND.text}>
            Med Card + Secure Call Flow
          </Heading>
          <Text color={BRAND.textMuted} mt={1} fontSize="md">
            Manager workflow: capture ID on phone, create secure telemedicine session, send encrypted draft to provider, then review compliance.
          </Text>
        </Box>
        <HStack spacing={3} flexWrap="wrap">
          <Button bg={BRAND.orange} color="white" _hover={{ bg: BRAND.orangeHover }} onClick={() => void createSession()} isLoading={creating}>
            Create Session
          </Button>
        </HStack>
      </Flex>

      <Box mt={5} bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
        <Wrap spacing={3} align="center">
          <WrapItem>
            <Text fontSize="sm" color={BRAND.textMuted} fontWeight="bold">
              Start all services:
            </Text>
          </WrapItem>
          <WrapItem>
            <Button
              size="sm"
              variant="outline"
              borderColor={BRAND.borderStrong}
              color={BRAND.textMuted}
              _hover={{ bg: '#342650' }}
              onClick={async () => {
                await navigator.clipboard.writeText(MED_CARD_LAUNCH_CMD);
                pushFlowEvent('Copied launcher command', MED_CARD_LAUNCH_CMD);
              }}
            >
              Copy `npm run dev:medcard`
            </Button>
          </WrapItem>
          <WrapItem>
            <Badge bg={health.scanner === 'online' ? '#23403A' : health.scanner === 'offline' ? '#4B2630' : '#3A334A'} color={health.scanner === 'online' ? '#7DE7C7' : health.scanner === 'offline' ? '#FFB6C5' : '#D9CCE8'}>
              Scanner: {health.scanner}
            </Badge>
          </WrapItem>
          <WrapItem>
            <Badge bg={health.signaling === 'online' ? '#23403A' : health.signaling === 'offline' ? '#4B2630' : '#3A334A'} color={health.signaling === 'online' ? '#7DE7C7' : health.signaling === 'offline' ? '#FFB6C5' : '#D9CCE8'}>
              Signaling: {health.signaling}
            </Badge>
          </WrapItem>
          <WrapItem>
            <Badge bg={health.secureWeb === 'online' ? '#23403A' : health.secureWeb === 'offline' ? '#4B2630' : '#3A334A'} color={health.secureWeb === 'online' ? '#7DE7C7' : health.secureWeb === 'offline' ? '#FFB6C5' : '#D9CCE8'}>
              Secure Web: {health.secureWeb}
            </Badge>
          </WrapItem>
        </Wrap>
      </Box>

      <Box mt={4} bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
        <Heading size="sm" color={BRAND.text}>
          Demo Steps
        </Heading>
        <Wrap spacing={2} mt={3}>
          <WrapItem>
            <Button size="sm" bg={BRAND.orange} color="white" _hover={{ bg: BRAND.orangeHover }} onClick={() => void openScanFor(latest ?? undefined)}>
              1) Scan ID
            </Button>
          </WrapItem>
          <WrapItem>
            <Button size="sm" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={() => void openScanFor(latest ?? undefined)}>
              2) Create Session + Send Draft
            </Button>
          </WrapItem>
          <WrapItem>
            <Button size="sm" as="a" href={latestUrls.providerUrl || undefined} target="_blank" rel="noreferrer" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} isDisabled={!latestUrls.providerUrl}>
              3) Open Provider
            </Button>
          </WrapItem>
          <WrapItem>
            <Button size="sm" as="a" href={latestUrls.patientUrl || undefined} target="_blank" rel="noreferrer" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} isDisabled={!latestUrls.patientUrl}>
              Open Patient
            </Button>
          </WrapItem>
          <WrapItem>
            <Button
              size="sm"
              bg={BRAND.orange}
              color="white"
              _hover={{ bg: BRAND.orangeHover }}
              isDisabled={!latestUrls.patientUrl || !secureCallUrlIsPublic}
              onClick={async () => {
                await navigator.clipboard.writeText(latestUrls.patientUrl);
                pushFlowEvent('Copied shareable patient link');
              }}
            >
              Copy Shareable Patient Link
            </Button>
          </WrapItem>
        </Wrap>
        {!secureCallUrlIsPublic ? (
          <Text color="#FFD6BE" fontSize="xs" mt={2}>
            Set Secure Call Public Web URL to an HTTPS public host first, then use "Copy Shareable Patient Link".
          </Text>
        ) : null}
      </Box>

      <Stack spacing={4} mt={6}>
        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Heading size="sm" color={BRAND.text}>
            End-to-End Workflow
          </Heading>
          <Text fontSize="sm" color={BRAND.textMuted} mt={1}>
            1) Open mobile scanner for license photo/barcode, 2) create secure session, 3) scan/send draft to provider, 4) open compliance demo.
          </Text>

          <FormControl mt={3}>
            <FormLabel color={BRAND.textMuted} fontSize="sm">
              Mobile Scanner URL (kiosk app)
            </FormLabel>
            <Input
              value={kioskAppUrl}
              onChange={(e) => setKioskAppUrl(e.target.value)}
              placeholder="http://localhost:5182"
              bg={BRAND.panelAlt}
              borderColor={BRAND.borderStrong}
              color={BRAND.text}
              _placeholder={{ color: BRAND.textSubtle }}
            />
          </FormControl>

          <Wrap spacing={2} mt={3}>
            <WrapItem>
              <Button
                size="sm"
                bg={BRAND.orange}
                color="white"
                _hover={{ bg: BRAND.orangeHover }}
                as="a"
                href={kioskAppUrl || undefined}
                target="_blank"
                rel="noreferrer"
                isDisabled={!kioskAppUrl}
              >
                Open Mobile Scanner
              </Button>
            </WrapItem>
            <WrapItem>
              <Button size="sm" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={() => navigate('/compliance-alerts')}>
                Open Compliance Demo
              </Button>
            </WrapItem>
            <WrapItem>
              <Button size="sm" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={() => navigate('/compliance')}>
                Open Compliance Dashboard
              </Button>
            </WrapItem>
          </Wrap>
        </Box>

        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Heading size="sm" color={BRAND.text}>
            Secure Call Public Web URL
          </Heading>
          <Text fontSize="sm" color={BRAND.textMuted} mt={1}>
            This URL is used to generate Provider/Patient links. For testing from another device, use an HTTPS public URL.
          </Text>
          <Input
            mt={3}
            value={secureCallWebUrl}
            onChange={(e) => setSecureCallWebUrl(e.target.value)}
            placeholder="https://...trycloudflare.com"
            bg={BRAND.panelAlt}
            borderColor={BRAND.borderStrong}
            color={BRAND.text}
            _placeholder={{ color: BRAND.textSubtle }}
          />
          {secureCallUrlLooksLocal ? (
            <Box mt={3} bg="#4A2D1F" border="1px solid" borderColor="#B4683E" borderRadius="md" p={3}>
              <Text color="#FFD6BE" fontSize="sm">
                Current URL is localhost-only. Replace it with a public HTTPS URL before sharing patient links outside this device.
              </Text>
            </Box>
          ) : null}
          <Divider my={4} borderColor={BRAND.border} />
          <FormControl>
            <FormLabel color={BRAND.textMuted} fontSize="sm">
              Admin Key (optional)
            </FormLabel>
            <Input
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="(not set)"
              bg={BRAND.panelAlt}
              borderColor={BRAND.borderStrong}
              color={BRAND.text}
              _placeholder={{ color: BRAND.textSubtle }}
            />
            <Text fontSize="xs" color={BRAND.textSubtle} mt={2}>
              If the secure-call server has <code>ADMIN_KEY</code> set, provide it here to create rooms.
            </Text>
          </FormControl>
        </Box>

        {err ? (
          <Box bg="red.900" border="1px solid" borderColor="red.700" borderRadius="lg" p={4}>
            <Text color="red.100" fontFamily="mono" fontSize="sm">
              {err}
            </Text>
          </Box>
        ) : null}

        {latest ? (
          <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
            <Heading size="sm" color={BRAND.text}>
              Latest Session
            </Heading>
            <Text color={BRAND.textMuted} fontSize="sm" mt={1}>
              Room <code>{latest.roomId}</code> · created {Math.round((Date.now() - latest.createdAt) / 1000)}s ago
            </Text>

            <Divider my={3} borderColor={BRAND.border} />
            <SessionActions
              session={latest}
              webUrl={secureCallWebUrl}
              onScan={() => void openScanFor(latest)}
            />
          </Box>
        ) : (
          <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
            <Text color={BRAND.textMuted}>No sessions yet. Create one to get started.</Text>
          </Box>
        )}

        {sessions.length > 1 ? (
          <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
            <Heading size="sm" color={BRAND.text}>
              Sessions
            </Heading>
            <Text color={BRAND.textMuted} fontSize="sm" mt={1}>
              Recent rooms stored locally on this device (max 50).
            </Text>

            <VStack align="stretch" spacing={3} mt={4}>
              {sessions.slice(0, 15).map((s, idx) => (
                <Box key={`${s.roomId}-${idx}`} border="1px solid" borderColor={BRAND.border} borderRadius="md" p={3} bg={BRAND.panelAlt}>
                  <Flex justify="space-between" gap={3} flexWrap="wrap" align="center">
                    <Text color={BRAND.text} fontWeight="bold">
                      {s.roomId}
                    </Text>
                    <HStack spacing={2} flexWrap="wrap">
                      <Badge bg="#4A2D1F" color="#FFD6BE" border="1px solid" borderColor="#B4683E" variant="subtle">
                        {Math.round((Date.now() - s.createdAt) / 1000)}s ago
                      </Badge>
                      <Button size="xs" variant="ghost" colorScheme="red" onClick={() => setSessions((prev) => prev.filter((x) => x !== s))}>
                        Remove
                      </Button>
                    </HStack>
                  </Flex>
                  <Box mt={3}>
                    <SessionActions session={s} webUrl={secureCallWebUrl} onScan={() => void openScanFor(s)} />
                  </Box>
                </Box>
              ))}
            </VStack>
          </Box>
        ) : null}

        <Box bg={BRAND.panel} border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4}>
          <Heading size="sm" color={BRAND.text}>
            Session Timeline
          </Heading>
          {flowEvents.length === 0 ? (
            <Text color={BRAND.textSubtle} fontSize="sm" mt={2}>
              No events yet. Start with "Scan ID".
            </Text>
          ) : (
            <VStack align="stretch" spacing={2} mt={3}>
              {flowEvents.map((event) => (
                <Box key={event.id} bg={BRAND.panelAlt} border="1px solid" borderColor={BRAND.border} borderRadius="md" p={2}>
                  <Text color={BRAND.text} fontSize="sm" fontWeight="bold">
                    {event.label}
                  </Text>
                  {event.detail ? (
                    <Text color={BRAND.textMuted} fontSize="xs" mt={1}>
                      {event.detail}
                    </Text>
                  ) : null}
                  <Text color={BRAND.textSubtle} fontSize="xs" mt={1}>
                    {new Date(event.at).toLocaleTimeString()}
                  </Text>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      </Stack>

      <Modal isOpen={scanModal.isOpen} onClose={scanModal.onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.700" />
        <ModalContent bg={BRAND.panelAlt} border="1px solid" borderColor={BRAND.border}>
          <ModalHeader color={BRAND.text}>Scan ID (Medical Card Draft)</ModalHeader>
          <ModalCloseButton color={BRAND.textMuted} />
          <ModalBody pb={6}>
            {!scanSession ? (
              <Text color={BRAND.textMuted}>No session selected.</Text>
            ) : (
              <Stack spacing={4}>
                <Text fontSize="sm" color={BRAND.textMuted}>
                  Room <code>{scanSession.roomId}</code>. After a successful scan, generate a provider link with an encrypted draft prefill.
                </Text>

                {scanErr ? (
                  <Box bg="red.900" border="1px solid" borderColor="red.700" borderRadius="lg" p={3}>
                    <Text color="red.100" fontFamily="mono" fontSize="sm">
                      {scanErr}
                    </Text>
                  </Box>
                ) : null}

                {!scanned ? (
                  <Pdf417Scanner
                    minimumAge={18}
                    onScan={(d) => {
                      setScanned(d);
                      setScanErr(null);
                      pushFlowEvent('ID scanned', d.fullName || `${d.firstName ?? ''} ${d.lastName ?? ''}`.trim());
                    }}
                    onError={(m) => setScanErr(m)}
                  />
                ) : (
                  <Stack spacing={4}>
                    <Box border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4} bg={BRAND.panel}>
                      <Heading size="sm" color={BRAND.text}>
                        ID Verified
                      </Heading>
                      <Wrap mt={3} spacing={3}>
                        <WrapItem>
                          <Badge bg="#4A2D1F" color="#FFD6BE" border="1px solid" borderColor="#B4683E">Name: {scanned.fullName || `${scanned.firstName} ${scanned.lastName}`}</Badge>
                        </WrapItem>
                        <WrapItem>
                          <Badge bg="#4A2D1F" color="#FFD6BE" border="1px solid" borderColor="#B4683E">DOB: {ymd(scanned.dateOfBirth)}</Badge>
                        </WrapItem>
                        <WrapItem>
                          <Badge bg="#4A2D1F" color="#FFD6BE" border="1px solid" borderColor="#B4683E">License #: {scanned.licenseNumber || '—'}</Badge>
                        </WrapItem>
                        <WrapItem>
                          <Badge bg="#4A2D1F" color="#FFD6BE" border="1px solid" borderColor="#B4683E">Age: {scanned.age ?? '—'}</Badge>
                        </WrapItem>
                      </Wrap>
                    </Box>

                    <Box border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={4} bg={BRAND.panel}>
                      <Heading size="sm" color={BRAND.text}>
                        Draft (Provider Prefill)
                      </Heading>
                      <Text fontSize="sm" color={BRAND.textMuted} mt={1}>
                        Optional fields can be edited here before sending to provider.
                      </Text>

                      <Stack spacing={3} mt={3}>
                        <Input
                          bg={BRAND.panelAlt}
                          borderColor={BRAND.borderStrong}
                          color={BRAND.text}
                          placeholder="Phone (optional)"
                          _placeholder={{ color: BRAND.textSubtle }}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                        />
                        <Input
                          bg={BRAND.panelAlt}
                          borderColor={BRAND.borderStrong}
                          color={BRAND.text}
                          placeholder="Email (optional)"
                          _placeholder={{ color: BRAND.textSubtle }}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                          bg={BRAND.panelAlt}
                          borderColor={BRAND.borderStrong}
                          color={BRAND.text}
                          placeholder="Registry ID (optional)"
                          _placeholder={{ color: BRAND.textSubtle }}
                          value={registryId}
                          onChange={(e) => setRegistryId(e.target.value)}
                        />

                        <HStack spacing={3} flexWrap="wrap">
                          <Button bg={BRAND.orange} color="white" _hover={{ bg: BRAND.orangeHover }} onClick={() => void buildProviderDraftLink()}>
                            Create Session + Send Draft
                          </Button>
                          <Button variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={() => setScanned(null)}>
                            Re-Scan
                          </Button>
                        </HStack>

                        {providerWithDraft ? (
                          <Box border="1px solid" borderColor={BRAND.border} borderRadius="lg" p={3} bg={BRAND.panelAlt}>
                            <Text fontSize="xs" color={BRAND.textSubtle}>
                              Provider link (encrypted draft in URL fragment)
                            </Text>
                            <Text fontSize="xs" color={BRAND.textMuted} fontFamily="mono" mt={2} wordBreak="break-all">
                              {providerWithDraft}
                            </Text>
                            <HStack mt={3} spacing={3} flexWrap="wrap">
                              <Button
                                size="sm"
                                variant="outline"
                                borderColor={BRAND.borderStrong}
                                color={BRAND.textMuted}
                                _hover={{ bg: '#342650' }}
                                onClick={async () => {
                                  await navigator.clipboard.writeText(providerWithDraft);
                                }}
                              >
                                Copy Provider
                              </Button>
                              <Button
                                size="sm"
                                bg={BRAND.orange}
                                color="white"
                                _hover={{ bg: BRAND.orangeHover }}
                                as="a"
                                href={providerWithDraft}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open Provider
                              </Button>
                            </HStack>
                          </Box>
                        ) : null}
                      </Stack>
                    </Box>
                  </Stack>
                )}
              </Stack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

function SessionActions(props: { session: Session; webUrl: string; onScan: () => void }) {
  const base = props.webUrl.trim();
  const urls = useMemo(() => {
    if (!base) return { providerUrl: '', patientUrl: '' };
    const providerUrl = buildRoomUrl({ webBaseUrl: base, roomId: props.session.roomId, role: 'provider', token: props.session.providerToken, sharedKey: props.session.sharedKey });
    const patientUrl = buildRoomUrl({ webBaseUrl: base, roomId: props.session.roomId, role: 'patient', token: props.session.patientToken, sharedKey: props.session.sharedKey });
    return { providerUrl, patientUrl };
  }, [base, props.session.roomId, props.session.patientToken, props.session.providerToken, props.session.sharedKey]);

  const disabled = !urls.providerUrl || !urls.patientUrl;

  return (
    <Stack spacing={3}>
      <Wrap spacing={2}>
        <WrapItem>
          <Button size="sm" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={() => void navigator.clipboard.writeText(urls.providerUrl)} isDisabled={disabled}>
            Copy Provider
          </Button>
        </WrapItem>
        <WrapItem>
          <Button size="sm" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={() => void navigator.clipboard.writeText(urls.patientUrl)} isDisabled={disabled}>
            Copy Patient
          </Button>
        </WrapItem>
        <WrapItem>
          <Button size="sm" as="a" href={urls.providerUrl} target="_blank" rel="noreferrer" bg={BRAND.orange} color="white" _hover={{ bg: BRAND.orangeHover }} isDisabled={disabled}>
            Open Provider
          </Button>
        </WrapItem>
        <WrapItem>
          <Button size="sm" as="a" href={urls.patientUrl} target="_blank" rel="noreferrer" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} isDisabled={disabled}>
            Open Patient
          </Button>
        </WrapItem>
        <WrapItem>
          <Button size="sm" variant="outline" borderColor={BRAND.borderStrong} color={BRAND.textMuted} _hover={{ bg: '#342650' }} onClick={props.onScan} isDisabled={disabled}>
            Scan ID + Send Draft
          </Button>
        </WrapItem>
      </Wrap>

      {!base ? (
        <Text color="#FFD6BE" fontSize="sm">
          Set <code>VITE_SECURE_CALL_WEB_URL</code> (or fill the field above) to enable provider/patient links.
        </Text>
      ) : null}
    </Stack>
  );
}
