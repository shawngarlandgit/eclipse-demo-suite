import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Icon,
  Button,
  Badge,
  Progress,
  Divider,
  Avatar,
} from '@chakra-ui/react';
import {
  FiStar,
  FiDroplet,
  FiSun,
  FiMoon,
  FiHeart,
  FiThumbsUp,
  FiThumbsDown,
  FiArrowLeft,
  FiShoppingCart,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * PatientRecommendationsPage - View Personalized Recommendations
 * Patients see their AI-generated strain recommendations
 */

interface StrainRecommendation {
  id: string;
  name: string;
  strainType: 'indica' | 'sativa' | 'hybrid';
  matchScore: number;
  thc: string;
  cbd: string;
  primaryTerpene: string;
  effects: string[];
  flavors: string[];
  whyRecommended: string;
  inStock: boolean;
  price?: number;
}

const mockRecommendations: StrainRecommendation[] = [
  {
    id: '1',
    name: 'Northern Lights',
    strainType: 'indica',
    matchScore: 95,
    thc: '18-22%',
    cbd: '<1%',
    primaryTerpene: 'Myrcene',
    effects: ['Relaxation', 'Sleep', 'Pain Relief'],
    flavors: ['Pine', 'Earthy', 'Sweet'],
    whyRecommended: 'Perfect for your sleep and pain relief needs. High myrcene content promotes relaxation.',
    inStock: true,
    price: 45,
  },
  {
    id: '2',
    name: 'Granddaddy Purple',
    strainType: 'indica',
    matchScore: 88,
    thc: '17-23%',
    cbd: '<1%',
    primaryTerpene: 'Linalool',
    effects: ['Relaxation', 'Sleep', 'Euphoria'],
    flavors: ['Grape', 'Berry', 'Sweet'],
    whyRecommended: 'Great for evening use with calming effects. Linalool terpene helps with anxiety.',
    inStock: true,
    price: 50,
  },
  {
    id: '3',
    name: 'ACDC',
    strainType: 'hybrid',
    matchScore: 82,
    thc: '1-6%',
    cbd: '14-20%',
    primaryTerpene: 'Myrcene',
    effects: ['Pain Relief', 'Relaxation', 'Focus'],
    flavors: ['Earthy', 'Woody', 'Pine'],
    whyRecommended: 'High CBD option for pain relief without strong psychoactive effects. Good for daytime.',
    inStock: false,
    price: 55,
  },
];

function PatientRecommendationsPage() {
  const navigate = useNavigate();

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

  const getStrainTypeColor = (type: string) => {
    switch (type) {
      case 'sativa':
        return 'orange';
      case 'indica':
        return 'purple';
      default:
        return 'green';
    }
  };

  return (
    <Box minH="100vh" bg="slate.900" py={8}>
      <Container maxW="container.lg">
        <VStack align="stretch" spacing={8}>
          {/* Header */}
          <VStack align="start" spacing={4}>
            <Button
              variant="ghost"
              color="slate.400"
              leftIcon={<Icon as={FiArrowLeft} />}
              onClick={() => navigate('/patient')}
            >
              Back to Dashboard
            </Button>
            <VStack align="start" spacing={2}>
              <HStack>
                <Icon as={FiStar} color="yellow.400" boxSize={6} />
                <Heading size="lg" color="white">
                  Your Personalized Recommendations
                </Heading>
              </HStack>
              <Text color="slate.400">
                Based on your questionnaire responses, we've found these strains that match your needs.
              </Text>
            </VStack>
          </VStack>

          {/* Summary Card */}
          <Card bg="cannabis.900/30" borderColor="cannabis.700" borderWidth="1px">
            <CardBody>
              <HStack spacing={6} wrap="wrap">
                <VStack align="start" spacing={1}>
                  <Text color="slate.400" fontSize="sm">Primary Need</Text>
                  <Badge colorScheme="cannabis" fontSize="md" px={3} py={1}>
                    Pain Relief & Sleep
                  </Badge>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text color="slate.400" fontSize="sm">Tolerance Level</Text>
                  <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
                    Low-Medium
                  </Badge>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text color="slate.400" fontSize="sm">Preferred Method</Text>
                  <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                    Flower
                  </Badge>
                </VStack>
                <VStack align="start" spacing={1}>
                  <Text color="slate.400" fontSize="sm">Usage Time</Text>
                  <Badge colorScheme="yellow" fontSize="md" px={3} py={1}>
                    Evening/Night
                  </Badge>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Recommendations */}
          <VStack align="stretch" spacing={4}>
            <Heading size="md" color="white">
              Top {mockRecommendations.length} Matches
            </Heading>

            {mockRecommendations.map((strain, index) => (
              <Card
                key={strain.id}
                bg="slate.800"
                borderColor={index === 0 ? 'cannabis.500' : 'slate.700'}
                borderWidth={index === 0 ? '2px' : '1px'}
                position="relative"
                overflow="hidden"
              >
                {index === 0 && (
                  <Box
                    position="absolute"
                    top={0}
                    right={0}
                    bg="cannabis.500"
                    px={3}
                    py={1}
                    borderBottomLeftRadius="md"
                  >
                    <HStack spacing={1}>
                      <Icon as={FiHeart} boxSize={3} />
                      <Text fontSize="xs" fontWeight="bold">Best Match</Text>
                    </HStack>
                  </Box>
                )}

                <CardBody>
                  <VStack align="stretch" spacing={4}>
                    {/* Header */}
                    <HStack justify="space-between" wrap="wrap" gap={4}>
                      <HStack spacing={4}>
                        <Avatar
                          size="lg"
                          icon={<Icon as={getStrainTypeIcon(strain.strainType)} boxSize={6} />}
                          bg={`${getStrainTypeColor(strain.strainType)}.500`}
                        />
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Heading size="md" color="white">{strain.name}</Heading>
                            <Badge colorScheme={getStrainTypeColor(strain.strainType)}>
                              {strain.strainType}
                            </Badge>
                          </HStack>
                          <HStack spacing={4} color="slate.400" fontSize="sm">
                            <Text>THC: <Text as="span" color="cannabis.400">{strain.thc}</Text></Text>
                            <Text>CBD: <Text as="span" color="blue.400">{strain.cbd}</Text></Text>
                            <Text>Terpene: <Text as="span" color="yellow.400">{strain.primaryTerpene}</Text></Text>
                          </HStack>
                        </VStack>
                      </HStack>

                      <VStack align="end" spacing={1}>
                        <Text color="slate.400" fontSize="sm">Match Score</Text>
                        <HStack>
                          <Progress
                            value={strain.matchScore}
                            size="sm"
                            colorScheme="cannabis"
                            w="100px"
                            bg="slate.700"
                            borderRadius="full"
                          />
                          <Text color="cannabis.400" fontWeight="bold">{strain.matchScore}%</Text>
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Why Recommended */}
                    <Box bg="slate.900" p={4} borderRadius="md">
                      <Text color="slate.300" fontSize="sm" fontStyle="italic">
                        "{strain.whyRecommended}"
                      </Text>
                    </Box>

                    {/* Effects & Flavors */}
                    <HStack spacing={8} wrap="wrap">
                      <VStack align="start" spacing={2}>
                        <Text color="slate.400" fontSize="sm">Effects</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {strain.effects.map((effect) => (
                            <Badge key={effect} colorScheme="green" variant="subtle">
                              {effect}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                      <VStack align="start" spacing={2}>
                        <Text color="slate.400" fontSize="sm">Flavors</Text>
                        <HStack spacing={2} flexWrap="wrap">
                          {strain.flavors.map((flavor) => (
                            <Badge key={flavor} colorScheme="orange" variant="subtle">
                              {flavor}
                            </Badge>
                          ))}
                        </HStack>
                      </VStack>
                    </HStack>

                    <Divider borderColor="slate.700" />

                    {/* Actions */}
                    <HStack justify="space-between">
                      <HStack spacing={4}>
                        {strain.inStock ? (
                          <Badge colorScheme="green" fontSize="sm">In Stock</Badge>
                        ) : (
                          <Badge colorScheme="red" fontSize="sm">Out of Stock</Badge>
                        )}
                        {strain.price && (
                          <Text color="white" fontWeight="bold">${strain.price}/eighth</Text>
                        )}
                      </HStack>
                      <HStack spacing={2}>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Icon as={FiThumbsUp} />}
                          colorScheme="green"
                        >
                          Helpful
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Icon as={FiThumbsDown} />}
                          colorScheme="red"
                        >
                          Not for me
                        </Button>
                        {strain.inStock && (
                          <Button
                            size="sm"
                            colorScheme="cannabis"
                            leftIcon={<Icon as={FiShoppingCart} />}
                          >
                            Add to Cart
                          </Button>
                        )}
                      </HStack>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>

          {/* Footer Actions */}
          <Card bg="slate.800" borderColor="slate.700" borderWidth="1px">
            <CardBody>
              <VStack spacing={4}>
                <Text color="slate.400" textAlign="center">
                  Not finding what you need? Talk to our budtender for personalized assistance.
                </Text>
                <HStack spacing={4}>
                  <Button variant="outline" colorScheme="cannabis">
                    Update Preferences
                  </Button>
                  <Button variant="ghost" color="slate.400">
                    Browse All Strains
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

export default PatientRecommendationsPage;
