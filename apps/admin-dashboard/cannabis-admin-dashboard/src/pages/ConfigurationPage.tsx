import { Box, Heading, Text } from '@chakra-ui/react';

function ConfigurationPage() {
  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Configuration
      </Heading>
      <Text color="slate.400" mb={6}>
        Integrations, user management, and system settings
      </Text>

      <Box className="card" p={6}>
        <Text color="slate.300">
          ⚙️ Configuration module will be built in Week 5
        </Text>
      </Box>
    </Box>
  );
}

export default ConfigurationPage;
