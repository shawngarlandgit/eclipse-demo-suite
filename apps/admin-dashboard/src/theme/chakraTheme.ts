import { extendTheme, type ThemeConfig } from '@chakra-ui/react';

// Cannabis Admin Dashboard Chakra UI Theme
// Matches the Tailwind theme for consistent branding

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

export const chakraTheme = extendTheme({
  config,
  colors: {
    // Cannabis brand colors (matches Tailwind config)
    brand: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    // Slate grays for dark mode
    slate: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    // Accent purple
    violet: {
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
    },
  },
  fonts: {
    heading: `'Inter', system-ui, -apple-system, sans-serif`,
    body: `'Inter', system-ui, -apple-system, sans-serif`,
    mono: `'Fira Code', monospace`,
  },
  styles: {
    global: {
      body: {
        bg: 'slate.900',
        color: 'slate.50',
      },
      '*::placeholder': {
        color: 'slate.300', // Improved contrast for WCAG AA compliance
      },
      '*, *::before, &::after': {
        borderColor: 'slate.700',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'medium',
        borderRadius: 'lg',
      },
      variants: {
        solid: {
          bg: 'brand.600',
          color: 'white',
          _hover: {
            bg: 'brand.700',
            _disabled: {
              bg: 'brand.600',
            },
          },
          _active: {
            bg: 'brand.800',
          },
        },
        outline: {
          borderColor: 'brand.600',
          color: 'brand.600',
          _hover: {
            bg: 'brand.900',
            borderColor: 'brand.500',
          },
        },
        ghost: {
          color: 'slate.300',
          _hover: {
            bg: 'slate.800',
          },
        },
        danger: {
          bg: 'red.600',
          color: 'white',
          _hover: {
            bg: 'red.700',
          },
          _active: {
            bg: 'red.800',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
        colorScheme: 'brand',
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: 'slate.800',
          borderRadius: 'lg',
          borderWidth: '1px',
          borderColor: 'slate.700',
          color: 'white',
        },
        header: {
          color: 'white',
        },
        body: {
          color: 'slate.100',
        },
        footer: {
          color: 'slate.300',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          color: 'slate.50',
        },
      },
      variants: {
        filled: {
          field: {
            bg: 'slate.800',
            borderColor: 'slate.600',
            _hover: {
              bg: 'slate.700',
            },
            _focus: {
              bg: 'slate.800',
              borderColor: 'brand.500',
              ring: 2,
              ringColor: 'brand.500',
            },
          },
        },
        outline: {
          field: {
            bg: 'slate.800',
            borderColor: 'slate.600',
            _hover: {
              borderColor: 'slate.500',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Select: {
      baseStyle: {
        field: {
          color: 'slate.50',
        },
      },
      variants: {
        filled: {
          field: {
            bg: 'slate.800',
            borderColor: 'slate.600',
            _hover: {
              bg: 'slate.700',
            },
            _focus: {
              bg: 'slate.800',
              borderColor: 'brand.500',
            },
          },
        },
        outline: {
          field: {
            bg: 'slate.800',
            borderColor: 'slate.600',
            _hover: {
              borderColor: 'slate.500',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
            },
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Textarea: {
      baseStyle: {
        color: 'slate.50',
      },
      variants: {
        filled: {
          bg: 'slate.800',
          borderColor: 'slate.600',
          _hover: {
            bg: 'slate.700',
          },
          _focus: {
            bg: 'slate.800',
            borderColor: 'brand.500',
          },
        },
        outline: {
          bg: 'slate.800',
          borderColor: 'slate.600',
          _hover: {
            borderColor: 'slate.500',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: `0 0 0 1px var(--chakra-colors-brand-500)`,
          },
        },
      },
      defaultProps: {
        variant: 'outline',
      },
    },
    Modal: {
      baseStyle: {
        dialog: {
          bg: 'slate.800',
          color: 'white',
        },
        header: {
          borderBottomWidth: '1px',
          borderColor: 'slate.700',
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'slate.700',
        },
        closeButton: {
          color: 'slate.400',
          _hover: {
            bg: 'slate.700',
          },
        },
      },
    },
    Drawer: {
      baseStyle: {
        dialog: {
          bg: 'slate.800',
          color: 'white',
        },
        header: {
          borderBottomWidth: '1px',
          borderColor: 'slate.700',
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'slate.700',
        },
        closeButton: {
          color: 'slate.400',
          _hover: {
            bg: 'slate.700',
          },
        },
      },
    },
    Table: {
      baseStyle: {
        table: {
          color: 'white',
        },
        th: {
          color: 'slate.300',
          borderColor: 'slate.700',
          textTransform: 'none',
          letterSpacing: 'normal',
        },
        td: {
          borderColor: 'slate.700',
        },
      },
      variants: {
        simple: {
          th: {
            bg: 'slate.900',
          },
          tbody: {
            tr: {
              _hover: {
                bg: 'slate.750',
              },
            },
          },
        },
        striped: {
          tbody: {
            tr: {
              '&:nth-of-type(odd)': {
                bg: 'slate.850',
              },
              _hover: {
                bg: 'slate.750',
              },
            },
          },
        },
      },
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        fontWeight: 'medium',
        fontSize: 'xs',
        px: 2.5,
        py: 0.5,
      },
      variants: {
        solid: {
          bg: 'brand.600',
          color: 'white',
        },
        subtle: {
          bg: 'brand.900',
          color: 'brand.400',
          borderWidth: '1px',
          borderColor: 'brand.700',
        },
        outline: {
          color: 'brand.400',
          borderWidth: '1px',
          borderColor: 'brand.600',
        },
      },
    },
    Alert: {
      baseStyle: {
        container: {
          borderRadius: 'lg',
        },
      },
      variants: {
        solid: {
          container: {
            bg: 'slate.800',
            borderWidth: '1px',
            borderColor: 'slate.700',
          },
        },
        subtle: {
          container: {
            bg: 'slate.800',
          },
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: 'slate.800',
          borderColor: 'slate.700',
          py: 2,
        },
        item: {
          bg: 'slate.800',
          color: 'slate.100',
          _hover: {
            bg: 'slate.700',
          },
          _focus: {
            bg: 'slate.700',
          },
        },
      },
    },
    Popover: {
      baseStyle: {
        content: {
          bg: 'slate.800',
          borderColor: 'slate.700',
          color: 'white',
        },
        header: {
          borderBottomWidth: '1px',
          borderColor: 'slate.700',
        },
        body: {
          color: 'slate.100',
        },
        footer: {
          borderTopWidth: '1px',
          borderColor: 'slate.700',
        },
      },
    },
    Tooltip: {
      baseStyle: {
        bg: 'slate.700',
        color: 'white',
        borderRadius: 'md',
        px: 3,
        py: 2,
      },
    },
    Tabs: {
      baseStyle: {
        tab: {
          color: 'slate.400',
          _selected: {
            color: 'brand.500',
            borderColor: 'brand.500',
          },
        },
      },
    },
    Stat: {
      baseStyle: {
        container: {
          color: 'white',
        },
        label: {
          color: 'slate.300', // Improved contrast for WCAG AA compliance
          fontWeight: 'medium',
        },
        number: {
          color: 'white',
          fontSize: '3xl',
          fontWeight: 'bold',
        },
        helpText: {
          color: 'slate.300', // Improved contrast for WCAG AA compliance
        },
      },
    },
  },
});

export default chakraTheme;
