import { ChakraProvider } from '@chakra-ui/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { chakraTheme } from './theme/chakraTheme';
import { queryClient } from './config/queryClient';
import AppRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { WalkthroughProvider } from './features/walkthrough';

/**
 * Cannabis Admin Dashboard - Main App Component
 *
 * Provider hierarchy:
 * 1. ChakraProvider - UI component theming
 * 2. QueryClientProvider - TanStack Query for data fetching
 * 3. WalkthroughProvider - Product tour functionality
 * 4. BrowserRouter - React Router for navigation
 */
function App() {
  return (
    <ErrorBoundary>
      <ChakraProvider theme={chakraTheme}>
        <QueryClientProvider client={queryClient}>
          <WalkthroughProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </WalkthroughProvider>

          {/* React Query Devtools - only visible in development */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </ChakraProvider>
    </ErrorBoundary>
  );
}

export default App;
