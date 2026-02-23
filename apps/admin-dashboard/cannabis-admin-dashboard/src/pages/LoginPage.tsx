import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  HStack,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    await login(email, password);
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="slate.900"
      px={4}
    >
      <Box
        className="card"
        w="full"
        maxW="md"
        p={8}
      >
        <VStack spacing={6} align="stretch">
          {/* Logo/Brand */}
          <VStack spacing={2}>
            <HStack spacing={3} justify="center">
              <Box
                w={12}
                h={12}
                bg="brand.600"
                rounded="lg"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl">🌿</Text>
              </Box>
            </HStack>
            <Heading size="lg" textAlign="center" color="white">
              Cannabis Admin
            </Heading>
            <Text fontSize="sm" color="slate.400" textAlign="center">
              Owner/Operator Dashboard
            </Text>
          </VStack>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!error}>
                <FormLabel color="slate.300">Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="input-field"
                />
              </FormControl>

              <FormControl isRequired isInvalid={!!error}>
                <FormLabel color="slate.300">Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>

              <Button
                type="submit"
                className="btn-primary"
                width="full"
                isLoading={isLoading}
                loadingText="Logging in..."
              >
                Login
              </Button>
            </VStack>
          </form>

          {/* Demo Credentials Hint (for development) */}
          {import.meta.env.DEV && (
            <Box p={3} bg="slate.700" rounded="md">
              <Text fontSize="xs" color="slate.300" mb={1}>
                Development Mode - Demo Credentials:
              </Text>
              <Text fontSize="xs" color="slate.400">
                Configure your Supabase credentials in .env.local to enable authentication
              </Text>
            </Box>
          )}

          {/* Footer Text */}
          <Text fontSize="xs" color="slate.500" textAlign="center" mt={4}>
            Secure access for authorized personnel only
          </Text>
        </VStack>
      </Box>
    </Flex>
  );
}

export default LoginPage;
