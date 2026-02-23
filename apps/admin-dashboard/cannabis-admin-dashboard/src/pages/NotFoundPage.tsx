import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="slate.900"
      px={4}
    >
      <VStack spacing={6}>
        <Heading size="3xl" color="brand.500">
          404
        </Heading>
        <Heading size="lg" color="white">
          Page Not Found
        </Heading>
        <Text color="slate.400" textAlign="center">
          The page you're looking for doesn't exist or has been moved.
        </Text>
        <Button
          className="btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </Button>
      </VStack>
    </Box>
  );
}

export default NotFoundPage;
