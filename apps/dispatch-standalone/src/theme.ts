import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

export const dispatchTheme = extendTheme({
  config,
  colors: {
    brand: {
      400: '#f79a6b',
      500: '#F26A2E',
      600: '#E24A2A',
      700: '#C93D25',
      800: '#9B2F1E',
      900: '#6E2218',
    },
    ops: {
      300: '#70D8CD',
      400: '#2CBFAE',
      500: '#1EA293',
      600: '#127A72',
      700: '#0E5B55',
    },
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#a9a3b4',
      500: '#8e8aa0',
      600: '#595579',
      700: '#3a3d58',
      750: '#2f324b',
      800: '#232437',
      850: '#1f2233',
      900: '#1c1630',
    },
  },
  styles: {
    global: {
      body: {
        bg: 'slate.900',
        color: 'slate.50',
      },
    },
  },
});
