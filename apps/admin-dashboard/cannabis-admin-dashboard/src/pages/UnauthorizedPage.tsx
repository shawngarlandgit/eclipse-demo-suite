import { Box, Center, VStack, Heading, Text, Button, Icon } from '@chakra-ui/react';
import { FiLock, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * UnauthorizedPage - 403 Access Denied
 * Shown when user doesn't have permission to access a resource
 */
function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Box minH="100vh" bg="slate.900">
      <Center h="100vh">
        <VStack spacing={6} textAlign="center" px={8}>
          <Box
            p={6}
            borderRadius="full"
            bg="red.900/20"
            border="2px solid"
            borderColor="red.500/30"
          >
            <Icon as={FiLock} boxSize={16} color="red.400" />
          </Box>

          <VStack spacing={2}>
            <Heading size="2xl" color="white">
              403
            </Heading>
            <Heading size="lg" color="slate.300">
              Access Denied
            </Heading>
            <Text color="slate.400" maxW="md">
              You don't have permission to access this page. If you believe this is an error,
              please contact your administrator.
            </Text>
          </VStack>

          <VStack spacing={3}>
            <Button
              colorScheme="cannabis"
              leftIcon={<Icon as={FiHome} />}
              onClick={() => navigate('/')}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="ghost"
              color="slate.400"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </VStack>
        </VStack>
      </Center>
    </Box>
  );
}

export default UnauthorizedPage;
