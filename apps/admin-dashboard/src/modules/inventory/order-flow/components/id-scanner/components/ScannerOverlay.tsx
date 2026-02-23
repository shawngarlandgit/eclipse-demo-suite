/**
 * Scanner Overlay Component
 *
 * Displays the scanning overlay with target rectangle, corner markers,
 * and animated scanning line on top of the video feed.
 */

import { Box, Text } from '@chakra-ui/react';
import type { ScannerOverlayProps } from '../types';

export function ScannerOverlay({ isVisible }: ScannerOverlayProps) {
  if (!isVisible) return null;

  return (
    <Box
      position="relative"
      w="full"
      maxW="400px"
      h="300px"
      mx="auto"
      mt="-300px"
      pointerEvents="none"
      zIndex={1}
    >
      {/* Semi-transparent overlay outside target area */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.400"
        sx={{
          clipPath:
            'polygon(0% 0%, 0% 100%, 15% 100%, 15% 25%, 85% 25%, 85% 75%, 15% 75%, 15% 100%, 100% 100%, 100% 0%)',
        }}
      />

      {/* Target rectangle for barcode */}
      <Box
        position="absolute"
        top="25%"
        left="15%"
        right="15%"
        bottom="25%"
        border="2px solid"
        borderColor="green.400"
        borderRadius="md"
      >
        {/* Corner markers */}
        <CornerMarker position="top-left" />
        <CornerMarker position="top-right" />
        <CornerMarker position="bottom-left" />
        <CornerMarker position="bottom-right" />

        {/* Scanning line animation */}
        <Box
          position="absolute"
          left="10%"
          right="10%"
          height="2px"
          bg="green.400"
          opacity={0.8}
          sx={{
            animation: 'scanLine 2s ease-in-out infinite',
            '@keyframes scanLine': {
              '0%': { top: '10%' },
              '50%': { top: '90%' },
              '100%': { top: '10%' },
            },
          }}
        />
      </Box>

      {/* Instruction text overlay */}
      <Text
        position="absolute"
        bottom="8px"
        left={0}
        right={0}
        textAlign="center"
        fontSize="xs"
        color="white"
        fontWeight="medium"
        textShadow="0 1px 2px rgba(0,0,0,0.8)"
      >
        Align barcode within frame
      </Text>
    </Box>
  );
}

/**
 * Corner marker for the target rectangle
 */
interface CornerMarkerProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

function CornerMarker({ position }: CornerMarkerProps) {
  const positionStyles: Record<string, Record<string, string>> = {
    'top-left': {
      top: '-2px',
      left: '-2px',
      borderTop: '4px solid',
      borderLeft: '4px solid',
      borderTopLeftRadius: 'md',
    },
    'top-right': {
      top: '-2px',
      right: '-2px',
      borderTop: '4px solid',
      borderRight: '4px solid',
      borderTopRightRadius: 'md',
    },
    'bottom-left': {
      bottom: '-2px',
      left: '-2px',
      borderBottom: '4px solid',
      borderLeft: '4px solid',
      borderBottomLeftRadius: 'md',
    },
    'bottom-right': {
      bottom: '-2px',
      right: '-2px',
      borderBottom: '4px solid',
      borderRight: '4px solid',
      borderBottomRightRadius: 'md',
    },
  };

  return (
    <Box
      position="absolute"
      w="20px"
      h="20px"
      borderColor="green.300"
      {...positionStyles[position]}
    />
  );
}
