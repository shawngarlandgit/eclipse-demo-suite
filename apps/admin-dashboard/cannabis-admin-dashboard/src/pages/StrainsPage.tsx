import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Button,
  Badge,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Image,
  Flex,
  Progress,
} from '@chakra-ui/react';
import { FiSearch, FiFilter, FiStar, FiTrendingUp, FiDroplet, FiSun, FiMoon } from 'react-icons/fi';
import { useState } from 'react';

/**
 * StrainsPage - Strain Library Interface
 * Displays strain catalog with effects, terpenes, and recommendation data
 */
function StrainsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [effectFilter, setEffectFilter] = useState('all');

  // Mock strains data
  const mockStrains = [
    {
      id: '1',
      name: 'Blue Dream',
      strainType: 'hybrid',
      thcMin: 17,
      thcMax: 24,
      cbdMin: 0.1,
      cbdMax: 0.2,
      primaryTerpene: 'Myrcene',
      primaryEffects: ['relaxation', 'creativity', 'energy'],
      flavors: ['Berry', 'Sweet', 'Earthy'],
      popularityScore: 95,
      recommendationCount: 342,
      imageUrl: null,
    },
    {
      id: '2',
      name: 'OG Kush',
      strainType: 'indica',
      thcMin: 19,
      thcMax: 26,
      cbdMin: 0,
      cbdMax: 0.3,
      primaryTerpene: 'Limonene',
      primaryEffects: ['relaxation', 'sleep', 'pain_relief'],
      flavors: ['Pine', 'Woody', 'Earthy'],
      popularityScore: 88,
      recommendationCount: 287,
      imageUrl: null,
    },
    {
      id: '3',
      name: 'Sour Diesel',
      strainType: 'sativa',
      thcMin: 18,
      thcMax: 26,
      cbdMin: 0.1,
      cbdMax: 0.2,
      primaryTerpene: 'Caryophyllene',
      primaryEffects: ['energy', 'focus', 'creativity'],
      flavors: ['Diesel', 'Citrus', 'Pungent'],
      popularityScore: 82,
      recommendationCount: 198,
      imageUrl: null,
    },
    {
      id: '4',
      name: 'Granddaddy Purple',
      strainType: 'indica',
      thcMin: 17,
      thcMax: 23,
      cbdMin: 0.1,
      cbdMax: 0.1,
      primaryTerpene: 'Myrcene',
      primaryEffects: ['relaxation', 'sleep', 'appetite'],
      flavors: ['Grape', 'Berry', 'Sweet'],
      popularityScore: 79,
      recommendationCount: 165,
      imageUrl: null,
    },
  ];

  const getStrainTypeIcon = (type: string) => {
    switch (type) {
      case 'sativa':
        return FiSun;
      case 'indica':
        return FiMoon;
      default:
        return FiDroplet;
    }
  };

  const getStrainTypeBadge = (type: string) => {
    const colors = {
      sativa: 'orange',
      indica: 'purple',
      hybrid: 'green',
      cbd: 'blue',
    };
    return (
      <Badge colorScheme={colors[type as keyof typeof colors] || 'gray'}>
        <HStack spacing={1}>
          <Icon as={getStrainTypeIcon(type)} boxSize={3} />
          <Text textTransform="capitalize">{type}</Text>
        </HStack>
      </Badge>
    );
  };

  return (
    <Box>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" wrap="wrap" gap={4}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="white">
              Strain Library
            </Heading>
            <Text color="slate.400">
              Browse and manage strain catalog
            </Text>
          </VStack>
          <HStack>
            <Button leftIcon={<FiFilter />} variant="outline" colorScheme="cannabis">
              Advanced Filters
            </Button>
          </HStack>
        </HStack>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Total Strains</Text>
                <Text color="white" fontSize="2xl" fontWeight="bold">3,838</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Indica</Text>
                <Text color="purple.400" fontSize="2xl" fontWeight="bold">1,245</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Sativa</Text>
                <Text color="orange.400" fontSize="2xl" fontWeight="bold">982</Text>
              </VStack>
            </CardBody>
          </Card>
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text color="slate.400" fontSize="sm">Hybrid</Text>
                <Text color="green.400" fontSize="2xl" fontWeight="bold">1,611</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters */}
        <HStack spacing={4} wrap="wrap">
          <InputGroup maxW="300px">
            <InputLeftElement>
              <Icon as={FiSearch} color="slate.400" />
            </InputLeftElement>
            <Input
              placeholder="Search strains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="slate.800"
              borderColor="slate.700"
              _placeholder={{ color: 'slate.500' }}
            />
          </InputGroup>
          <Select
            maxW="150px"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            bg="slate.800"
            borderColor="slate.700"
          >
            <option value="all">All Types</option>
            <option value="indica">Indica</option>
            <option value="sativa">Sativa</option>
            <option value="hybrid">Hybrid</option>
            <option value="cbd">CBD</option>
          </Select>
          <Select
            maxW="180px"
            value={effectFilter}
            onChange={(e) => setEffectFilter(e.target.value)}
            bg="slate.800"
            borderColor="slate.700"
          >
            <option value="all">All Effects</option>
            <option value="relaxation">Relaxation</option>
            <option value="pain_relief">Pain Relief</option>
            <option value="energy">Energy</option>
            <option value="sleep">Sleep</option>
            <option value="focus">Focus</option>
            <option value="creativity">Creativity</option>
          </Select>
        </HStack>

        {/* Strains Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
          {mockStrains.map((strain) => (
            <Card
              key={strain.id}
              bg="slate.800"
              borderColor="slate.700"
              borderWidth="1px"
              _hover={{ borderColor: 'cannabis.500', transform: 'translateY(-2px)' }}
              transition="all 0.2s"
              cursor="pointer"
            >
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  {/* Strain Image Placeholder */}
                  <Box
                    h="120px"
                    bg="slate.700"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {strain.imageUrl ? (
                      <Image src={strain.imageUrl} alt={strain.name} objectFit="cover" />
                    ) : (
                      <Icon as={FiDroplet} boxSize={10} color="cannabis.500" />
                    )}
                  </Box>

                  {/* Strain Info */}
                  <VStack align="start" spacing={2}>
                    <HStack justify="space-between" w="full">
                      <Heading size="sm" color="white">{strain.name}</Heading>
                      {getStrainTypeBadge(strain.strainType)}
                    </HStack>

                    {/* THC/CBD */}
                    <HStack spacing={4} fontSize="sm">
                      <VStack align="start" spacing={0}>
                        <Text color="slate.400" fontSize="xs">THC</Text>
                        <Text color="cannabis.400" fontWeight="medium">
                          {strain.thcMin}-{strain.thcMax}%
                        </Text>
                      </VStack>
                      <VStack align="start" spacing={0}>
                        <Text color="slate.400" fontSize="xs">CBD</Text>
                        <Text color="blue.400" fontWeight="medium">
                          {strain.cbdMax > 0 ? `${strain.cbdMin}-${strain.cbdMax}%` : '<0.1%'}
                        </Text>
                      </VStack>
                    </HStack>

                    {/* Primary Terpene */}
                    <Text color="slate.400" fontSize="xs">
                      Primary Terpene: <Text as="span" color="yellow.400">{strain.primaryTerpene}</Text>
                    </Text>

                    {/* Effects */}
                    <Flex wrap="wrap" gap={1}>
                      {strain.primaryEffects.slice(0, 3).map((effect) => (
                        <Badge key={effect} colorScheme="cannabis" fontSize="xs" variant="subtle">
                          {effect.replace('_', ' ')}
                        </Badge>
                      ))}
                    </Flex>

                    {/* Popularity */}
                    <Box w="full">
                      <HStack justify="space-between" mb={1}>
                        <HStack spacing={1}>
                          <Icon as={FiTrendingUp} color="slate.400" boxSize={3} />
                          <Text color="slate.400" fontSize="xs">Popularity</Text>
                        </HStack>
                        <Text color="white" fontSize="xs">{strain.popularityScore}%</Text>
                      </HStack>
                      <Progress
                        value={strain.popularityScore}
                        size="xs"
                        colorScheme="cannabis"
                        bg="slate.700"
                        borderRadius="full"
                      />
                    </Box>

                    {/* Recommendation Count */}
                    <HStack spacing={1}>
                      <Icon as={FiStar} color="yellow.400" boxSize={3} />
                      <Text color="slate.400" fontSize="xs">
                        {strain.recommendationCount} recommendations
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
}

export default StrainsPage;
