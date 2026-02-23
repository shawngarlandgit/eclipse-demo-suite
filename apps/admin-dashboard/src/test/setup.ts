import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_BYPASS_AUTH: 'false',
    DEV: false,
    PROD: true,
    MODE: 'test',
  },
});

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
  useUser: vi.fn(() => ({ user: null, isLoaded: true, isSignedIn: false })),
  useClerk: vi.fn(() => ({ signOut: vi.fn() })),
  useAuth: vi.fn(() => ({ isLoaded: true, isSignedIn: false })),
  SignedIn: ({ children }: { children: React.ReactNode }) => null,
  SignedOut: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Convex
vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => undefined),
  useMutation: vi.fn(() => vi.fn()),
  useConvex: vi.fn(),
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
    useLocation: vi.fn(() => ({ pathname: '/', state: null })),
  };
});
