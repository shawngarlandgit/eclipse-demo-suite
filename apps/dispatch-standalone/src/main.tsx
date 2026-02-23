import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, Box } from '@chakra-ui/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { dispatchTheme } from './theme';
import App from './App';

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <ChakraProvider theme={dispatchTheme}>
        <Box minH="100vh" p={6}>
          <App />
        </Box>
      </ChakraProvider>
    </ConvexProvider>
  </StrictMode>
);
