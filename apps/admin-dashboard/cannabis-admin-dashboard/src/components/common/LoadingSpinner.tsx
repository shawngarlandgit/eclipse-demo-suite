import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * LoadingSpinner Component
 * Displays a loading spinner with optional message
 */
function LoadingSpinner({
  fullScreen = false,
  message = 'Loading...',
  size = 'xl'
}: LoadingSpinnerProps) {
  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="slate.700"
        color="brand.500"
        size={size}
      />
      {message && (
        <Text color="slate.300" fontSize="sm">
          {message}
        </Text>
      )}
    </VStack>
  );

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="slate.900"
        zIndex={9999}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="200px"
      w="full"
    >
      {content}
    </Box>
  );
}

export default LoadingSpinner;
