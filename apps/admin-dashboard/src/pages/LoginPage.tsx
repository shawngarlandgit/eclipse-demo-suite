import { Box, Flex, Heading, Text, VStack, HStack } from '@chakra-ui/react';
import { SignIn } from '@clerk/clerk-react';

/**
 * LoginPage Component
 * Uses Clerk's SignIn component for authentication
 */
function LoginPage() {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="slate.900"
      px={4}
    >
      <Box w="full" maxW="md">
        <VStack spacing={6} align="stretch">
          {/* Logo/Brand */}
          <VStack spacing={2} mb={4}>
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

          {/* Clerk SignIn Component */}
          <Box
            sx={{
              '& .cl-rootBox': {
                width: '100%',
              },
              '& .cl-card': {
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: 'none',
              },
              '& .cl-headerTitle, & .cl-headerSubtitle': {
                display: 'none',
              },
            }}
          >
            <SignIn
              appearance={{
                elements: {
                  rootBox: {
                    width: '100%',
                  },
                  card: {
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                  },
                  headerTitle: {
                    display: 'none',
                  },
                  headerSubtitle: {
                    display: 'none',
                  },
                  formButtonPrimary: {
                    backgroundColor: '#16a34a',
                    '&:hover': {
                      backgroundColor: '#15803d',
                    },
                  },
                  formFieldInput: {
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    '&:focus': {
                      borderColor: '#16a34a',
                    },
                  },
                  formFieldLabel: {
                    color: '#cbd5e1',
                  },
                  footerActionLink: {
                    color: '#16a34a',
                  },
                  identityPreviewText: {
                    color: '#f8fafc',
                  },
                  identityPreviewEditButton: {
                    color: '#16a34a',
                  },
                },
              }}
              routing="path"
              path="/login"
              signUpUrl="/signup"
              afterSignInUrl="/"
            />
          </Box>

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
