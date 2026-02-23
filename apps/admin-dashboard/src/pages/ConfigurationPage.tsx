import { Box, Heading, Text, VStack, HStack, Select, FormControl, FormLabel, FormHelperText, Divider, Badge, SimpleGrid, useToast } from '@chakra-ui/react';
import { useSettingsStore, DASHBOARD_STYLES, type DashboardStyle } from '../stores/settingsStore';

function ConfigurationPage() {
  const { dashboardStyle, setDashboardStyle } = useSettingsStore();
  const toast = useToast();

  const handleDashboardStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStyle = e.target.value as DashboardStyle;
    setDashboardStyle(newStyle);

    const selectedOption = DASHBOARD_STYLES.find(s => s.id === newStyle);
    toast({
      title: 'Dashboard Updated',
      description: `Now using "${selectedOption?.name}" layout`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const simpleStyles = DASHBOARD_STYLES.filter(s => s.category === 'simple');
  const detailedStyles = DASHBOARD_STYLES.filter(s => s.category === 'detailed');
  const currentStyle = DASHBOARD_STYLES.find(s => s.id === dashboardStyle);

  return (
    <Box>
      <Heading size="lg" mb={2} color="white">
        Configuration
      </Heading>
      <Text color="slate.400" mb={6}>
        Customize your dashboard and system settings
      </Text>

      <VStack spacing={6} align="stretch">
        {/* Dashboard Settings */}
        <Box bg="slate.800" borderRadius="xl" p={6}>
          <HStack mb={4}>
            <Heading size="md" color="white">Dashboard Layout</Heading>
            <Badge colorScheme="green" fontSize="xs">Saved automatically</Badge>
          </HStack>

          <Text color="slate.400" fontSize="sm" mb={6}>
            Choose how your dashboard displays information. Simple layouts are recommended for quick glances,
            while detailed layouts show more data at once.
          </Text>

          <FormControl>
            <FormLabel color="slate.300">Dashboard Style</FormLabel>
            <Select
              value={dashboardStyle}
              onChange={handleDashboardStyleChange}
              bg="slate.700"
              borderColor="slate.600"
              color="white"
              _hover={{ borderColor: 'slate.500' }}
              size="lg"
            >
              <optgroup label="Simple Layouts (Recommended)">
                {simpleStyles.map(style => (
                  <option key={style.id} value={style.id}>
                    {style.name} - {style.description}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Detailed Layouts">
                {detailedStyles.map(style => (
                  <option key={style.id} value={style.id}>
                    {style.name} - {style.description}
                  </option>
                ))}
              </optgroup>
            </Select>
            <FormHelperText color="slate.500">
              Your preference is saved and will persist across sessions
            </FormHelperText>
          </FormControl>

          {/* Preview Info */}
          <Box mt={6} p={4} bg="slate.700" borderRadius="lg" borderLeft="4px solid" borderLeftColor="emerald.400">
            <Text color="slate.300" fontSize="sm">
              <Text as="span" fontWeight="bold" color="white">Currently using: </Text>
              {currentStyle?.name}
            </Text>
            <Text color="slate.400" fontSize="sm" mt={1}>
              {currentStyle?.description}
            </Text>
          </Box>
        </Box>

        {/* Layout Descriptions */}
        <Box bg="slate.800" borderRadius="xl" p={6}>
          <Heading size="md" color="white" mb={4}>Layout Guide</Heading>

          <Text color="emerald.400" fontWeight="bold" fontSize="sm" mb={3}>
            SIMPLE LAYOUTS
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
            {simpleStyles.map(style => (
              <Box
                key={style.id}
                p={4}
                bg={dashboardStyle === style.id ? 'slate.600' : 'slate.700'}
                borderRadius="lg"
                border="2px solid"
                borderColor={dashboardStyle === style.id ? 'emerald.400' : 'transparent'}
                cursor="pointer"
                role="button"
                tabIndex={0}
                aria-pressed={dashboardStyle === style.id}
                aria-label={`Select ${style.name} layout`}
                onClick={() => {
                  setDashboardStyle(style.id);
                  toast({
                    title: 'Dashboard Updated',
                    description: `Now using "${style.name}" layout`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDashboardStyle(style.id);
                    toast({
                      title: 'Dashboard Updated',
                      description: `Now using "${style.name}" layout`,
                      status: 'success',
                      duration: 2000,
                      isClosable: true,
                    });
                  }
                }}
                _hover={{ bg: 'slate.600' }}
                _focus={{ outline: '2px solid', outlineColor: 'emerald.400', outlineOffset: '2px' }}
                transition="all 0.2s"
              >
                <HStack justify="space-between" mb={1}>
                  <Text color="white" fontWeight="bold">{style.name}</Text>
                  {dashboardStyle === style.id && (
                    <Badge colorScheme="green" fontSize="xs">Active</Badge>
                  )}
                </HStack>
                <Text color="slate.400" fontSize="sm">{style.description}</Text>
              </Box>
            ))}
          </SimpleGrid>

          <Divider borderColor="slate.600" my={4} />

          <Text color="blue.400" fontWeight="bold" fontSize="sm" mb={3}>
            DETAILED LAYOUTS
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {detailedStyles.map(style => (
              <Box
                key={style.id}
                p={4}
                bg={dashboardStyle === style.id ? 'slate.600' : 'slate.700'}
                borderRadius="lg"
                border="2px solid"
                borderColor={dashboardStyle === style.id ? 'blue.400' : 'transparent'}
                cursor="pointer"
                role="button"
                tabIndex={0}
                aria-pressed={dashboardStyle === style.id}
                aria-label={`Select ${style.name} layout`}
                onClick={() => {
                  setDashboardStyle(style.id);
                  toast({
                    title: 'Dashboard Updated',
                    description: `Now using "${style.name}" layout`,
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDashboardStyle(style.id);
                    toast({
                      title: 'Dashboard Updated',
                      description: `Now using "${style.name}" layout`,
                      status: 'success',
                      duration: 2000,
                      isClosable: true,
                    });
                  }
                }}
                _hover={{ bg: 'slate.600' }}
                _focus={{ outline: '2px solid', outlineColor: 'blue.400', outlineOffset: '2px' }}
                transition="all 0.2s"
              >
                <HStack justify="space-between" mb={1}>
                  <Text color="white" fontWeight="bold">{style.name}</Text>
                  {dashboardStyle === style.id && (
                    <Badge colorScheme="blue" fontSize="xs">Active</Badge>
                  )}
                </HStack>
                <Text color="slate.400" fontSize="sm">{style.description}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Box>

        {/* Placeholder for future settings */}
        <Box bg="slate.800" borderRadius="xl" p={6} opacity={0.6}>
          <Heading size="md" color="white" mb={2}>More Settings Coming Soon</Heading>
          <Text color="slate.400" fontSize="sm">
            Integrations, user management, and notification preferences will be available in a future update.
          </Text>
        </Box>
      </VStack>
    </Box>
  );
}

export default ConfigurationPage;
