import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Box, Button, Heading, Text, VStack, Code } from '@chakra-ui/react';
import * as Sentry from '@sentry/react';
import { log } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the component tree and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to logger
    log.error('ErrorBoundary caught an error', { error, errorInfo }, 'ErrorBoundary');

    this.setState({
      error,
      errorInfo,
    });

    // Report error to Sentry (production only)
    if (import.meta.env.PROD) {
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
          bg="slate.900"
          p={6}
        >
          <VStack
            spacing={6}
            maxW="2xl"
            bg="slate.800"
            p={8}
            borderRadius="lg"
            border="1px"
            borderColor="red.700"
          >
            <Heading size="lg" color="red.400">
              Something went wrong
            </Heading>

            <Text color="slate.300" textAlign="center">
              We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
            </Text>

            {/* Only show detailed error info in development mode */}
            {import.meta.env.DEV && this.state.error && (
              <VStack align="stretch" w="full" spacing={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="bold" color="slate.400" mb={2}>
                    Error Message:
                  </Text>
                  <Code
                    display="block"
                    p={3}
                    bg="slate.900"
                    color="red.400"
                    rounded="md"
                    fontSize="sm"
                  >
                    {this.state.error.toString()}
                  </Code>
                </Box>

                {this.state.errorInfo && (
                  <Box>
                    <Text fontSize="sm" fontWeight="bold" color="slate.400" mb={2}>
                      Component Stack:
                    </Text>
                    <Code
                      display="block"
                      p={3}
                      bg="slate.900"
                      color="slate.400"
                      rounded="md"
                      fontSize="xs"
                      whiteSpace="pre-wrap"
                      maxH="200px"
                      overflowY="auto"
                    >
                      {this.state.errorInfo.componentStack}
                    </Code>
                  </Box>
                )}
              </VStack>
            )}

            <Button
              colorScheme="cannabis"
              onClick={this.handleReset}
              size="lg"
            >
              Try Again
            </Button>

            <Button
              variant="ghost"
              color="slate.400"
              onClick={() => window.location.href = '/'}
              size="sm"
            >
              Go to Home
            </Button>
          </VStack>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
