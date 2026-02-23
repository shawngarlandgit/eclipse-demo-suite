/**
 * Step: Scan ID
 * Customer identification verification step
 * - Uses device camera to scan ID barcode (PDF417)
 * - Budtender mode: Allows manual confirm/skip
 * - Kiosk mode: Requires scan verification to proceed
 */

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Icon,
  Divider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import {
  IdentificationIcon,
  CheckCircleIcon,
  UserIcon,
  CameraIcon,
  PencilSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useOrder } from '../OrderContext';
import IDScanner from '../components/IDScanner';
import RecommendationPanel from '../components/RecommendationPanel';
import { useCustomerLookup } from '../hooks/useCustomerLookup';
import type { ParsedLicenseData } from '../utils/parseDriverLicense';

function StepScanID() {
  const { state, verifyCustomer, skipVerification, setCustomerLookup, nextStep } = useOrder();
  const isKiosk = state.mode === 'kiosk';

  // Customer lookup hook
  const {
    customer,
    isReturning,
    purchaseHistory,
    isLoading: isCustomerLoading,
    lookupByLicense,
  } = useCustomerLookup();

  // Local form state
  const [customerName, setCustomerName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedLicense, setScannedLicense] = useState<ParsedLicenseData | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isProcessingScan, setIsProcessingScan] = useState(false);

  // Track added products for recommendation cards
  const addedProductIds = new Set(state.cart.map(item => item.product.id));

  // Handle successful camera scan
  const handleScanSuccess = async (data: ParsedLicenseData) => {

    // Set processing state to prevent showing success screen
    setIsProcessingScan(true);

    // Store the full license data for display
    setScannedLicense(data);

    // Verify customer first
    verifyCustomer({
      method: 'scan',
      idNumber: data.licenseNumber || `SCAN-${Date.now()}`,
      customerName: data.fullName || 'Verified Customer',
      dateOfBirth: data.dateOfBirth?.toISOString().split('T')[0] || null,
    });

    // Look up or create customer in database (do this before navigating)
    if (data.licenseNumber) {
      try {
        const result = await lookupByLicense(
          data.licenseNumber,
          data.firstName,
          data.lastName
        );

        // Store customer lookup data in context for the recommendations step
        if (result) {
          setCustomerLookup({
            customerId: result.customer?.id || null,
            isReturning: result.isReturning,
            purchaseHistory: result.purchaseHistory ? {
              preferredStrainType: result.purchaseHistory.preferredStrainType,
              topEffects: result.purchaseHistory.topEffects,
              favoriteStrains: result.purchaseHistory.favoriteStrains,
              totalTransactions: result.purchaseHistory.totalPurchases,
            } : null,
          });
        }
      } catch (err) {
        console.error('[StepScanID] Customer lookup error:', err);
        // Continue even if lookup fails
      }
    }

    // Proceed to recommendations step immediately
    nextStep();
  };

  // Handle add to cart from recommendations
  const handleAddToCart = (_productId: string) => {
    // Find product in inventory and add to cart
    // For now, we'll handle this in the parent context
  };

  // Handle scan error
  const handleScanError = (error: string) => {
    console.error('[StepScanID] Scan error:', error);
    setScanError(error);
  };

  // Manual verification (budtender only)
  const handleManualVerify = () => {
    if (!customerName) return;

    verifyCustomer({
      method: 'manual',
      idNumber: idNumber || null,
      customerName,
      dateOfBirth: dateOfBirth || null,
    });
    nextStep();
  };

  // Skip verification (budtender only)
  const handleSkip = () => {
    skipVerification();
    nextStep();
  };

  // Show processing state while scan is being handled
  if (isProcessingScan) {
    return (
      <VStack spacing={6} py={6} align="center">
        <Spinner size="xl" color="green.400" thickness="4px" />
        <Text fontSize="lg" color="white">Processing ID...</Text>
        <Text fontSize="sm" color="slate.400">Setting up your experience</Text>
      </VStack>
    );
  }

  // Already verified - show success with full license details (only if user comes back to this step)
  if (state.customer.verified) {
    return (
      <VStack spacing={6} py={6} align="center">
        <Box
          w={16}
          h={16}
          borderRadius="full"
          bg="green.500"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={CheckCircleIcon} boxSize={10} color="white" />
        </Box>

        <VStack spacing={1}>
          <Text fontSize="xl" fontWeight="bold" color="white">
            ID Verified
          </Text>
          <Badge colorScheme="green" fontSize="sm">
            {state.customer.method === 'scan' ? 'Scanned from Barcode' : 'Manual Entry'}
          </Badge>
        </VStack>

        {/* License Details Card */}
        <Box
          bg="slate.800"
          p={5}
          borderRadius="lg"
          border="1px"
          borderColor="green.600"
          w="full"
          maxW="350px"
        >
          <VStack spacing={3} align="stretch">
            {/* Name */}
            {(scannedLicense?.fullName || state.customer.customerName) && (
              <Box>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>
                  Full Name
                </Text>
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {scannedLicense?.fullName || state.customer.customerName}
                </Text>
              </Box>
            )}

            <HStack spacing={4}>
              {/* Date of Birth */}
              {(scannedLicense?.dateOfBirth || state.customer.dateOfBirth) && (
                <Box flex={1}>
                  <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>
                    Date of Birth
                  </Text>
                  <Text fontSize="md" color="white">
                    {scannedLicense?.dateOfBirth
                      ? scannedLicense.dateOfBirth.toLocaleDateString()
                      : state.customer.dateOfBirth}
                  </Text>
                </Box>
              )}

              {/* Age */}
              {scannedLicense?.age && (
                <Box>
                  <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>
                    Age
                  </Text>
                  <HStack>
                    <Text fontSize="md" fontWeight="bold" color="white">
                      {scannedLicense.age}
                    </Text>
                    <Badge colorScheme="green" size="sm">21+</Badge>
                  </HStack>
                </Box>
              )}
            </HStack>

            {/* License Number */}
            {(scannedLicense?.licenseNumber || state.customer.idNumber) && (
              <Box>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>
                  License Number
                </Text>
                <Text fontSize="md" fontFamily="mono" color="white">
                  {scannedLicense?.licenseNumber || state.customer.idNumber}
                </Text>
              </Box>
            )}

            {/* Expiration */}
            {scannedLicense?.expirationDate && (
              <Box>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>
                  Expires
                </Text>
                <HStack>
                  <Text fontSize="md" color="white">
                    {scannedLicense.expirationDate.toLocaleDateString()}
                  </Text>
                  {scannedLicense.isExpired ? (
                    <Badge colorScheme="red">EXPIRED</Badge>
                  ) : (
                    <Badge colorScheme="green">Valid</Badge>
                  )}
                </HStack>
              </Box>
            )}

            {/* State/Address if available */}
            {scannedLicense?.address?.state && (
              <Box>
                <Text fontSize="xs" color="slate.500" textTransform="uppercase" mb={1}>
                  State
                </Text>
                <Text fontSize="md" color="white">
                  {scannedLicense.address.state}
                </Text>
              </Box>
            )}
          </VStack>
        </Box>

        {/* Customer Status */}
        {isCustomerLoading ? (
          <HStack spacing={2} color="slate.400">
            <Spinner size="sm" />
            <Text fontSize="sm">Looking up customer history...</Text>
          </HStack>
        ) : isReturning && customer ? (
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
            <HStack spacing={1}>
              <Icon as={SparklesIcon} boxSize={4} />
              <Text>Welcome back! {customer.total_transactions} previous visits</Text>
            </HStack>
          </Badge>
        ) : null}

        {/* Recommendations for returning customers */}
        {showRecommendations && isReturning && purchaseHistory && (
          <Box w="full" maxW="600px">
            <RecommendationPanel
              context="returning_customer"
              customerId={customer?.id}
              purchaseHistory={purchaseHistory}
              onAddToCart={handleAddToCart}
              onDismiss={() => setShowRecommendations(false)}
              addedProductIds={addedProductIds}
            />
          </Box>
        )}

        <Button colorScheme="green" size="lg" onClick={nextStep} px={8}>
          Continue
        </Button>
      </VStack>
    );
  }

  // Kiosk Mode - Camera Only
  if (isKiosk) {
    return (
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack spacing={2} textAlign="center" py={4}>
          <Icon as={IdentificationIcon} boxSize={12} color="green.400" />
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Scan Your ID
          </Text>
          <Text color="slate.400" fontSize="lg">
            Hold the barcode on the back of your ID in front of the camera
          </Text>
        </VStack>

        {/* Camera Scanner */}
        <Box
          bg="slate.800"
          borderRadius="lg"
          p={6}
          border="1px"
          borderColor="slate.700"
        >
          <IDScanner
            onScanSuccess={handleScanSuccess}
            onScanError={handleScanError}
          />
        </Box>

        {scanError && (
          <Text color="red.400" textAlign="center" fontSize="sm">
            {scanError}
          </Text>
        )}
      </VStack>
    );
  }

  // Budtender Mode - Tabs for Camera or Manual Entry
  return (
    <VStack spacing={4} align="stretch">
      {/* Header */}
      <VStack spacing={2} textAlign="center" py={2}>
        <Icon as={IdentificationIcon} boxSize={10} color="slate.400" />
        <Text fontSize="xl" fontWeight="bold" color="white">
          Customer Verification
        </Text>
        <Text color="slate.400">
          Scan customer ID or enter information manually
        </Text>
      </VStack>

      {/* Verification Methods */}
      <Tabs
        variant="soft-rounded"
        colorScheme="green"
        isFitted
        defaultIndex={0}
      >
        <TabList bg="slate.800" borderRadius="lg" p={1}>
          <Tab
            _selected={{ bg: 'green.600', color: 'white' }}
            color="slate.400"
          >
            <HStack spacing={2}>
              <Icon as={CameraIcon} boxSize={4} />
              <Text>Camera Scan</Text>
            </HStack>
          </Tab>
          <Tab
            _selected={{ bg: 'green.600', color: 'white' }}
            color="slate.400"
          >
            <HStack spacing={2}>
              <Icon as={PencilSquareIcon} boxSize={4} />
              <Text>Manual Entry</Text>
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Camera Scan Tab */}
          <TabPanel px={0}>
            <Box
              bg="slate.800"
              borderRadius="lg"
              p={4}
              border="1px"
              borderColor="slate.700"
            >
              <IDScanner
                onScanSuccess={handleScanSuccess}
                onScanError={handleScanError}
                onCancel={() => {}}
              />
            </Box>
          </TabPanel>

          {/* Manual Entry Tab */}
          <TabPanel px={0}>
            <Box
              bg="slate.800"
              borderRadius="lg"
              p={4}
              border="1px"
              borderColor="slate.700"
            >
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel fontSize="sm" color="slate.300">
                    Customer Name
                  </FormLabel>
                  <Input
                    placeholder="Enter customer name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    bg="slate.750"
                    borderColor="slate.600"
                    _hover={{ borderColor: 'slate.500' }}
                    _focus={{ borderColor: 'green.500' }}
                    size="lg"
                  />
                </FormControl>

                <HStack spacing={4}>
                  <FormControl flex={1}>
                    <FormLabel fontSize="sm" color="slate.300">
                      Date of Birth
                    </FormLabel>
                    <Input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      bg="slate.750"
                      borderColor="slate.600"
                      _hover={{ borderColor: 'slate.500' }}
                      _focus={{ borderColor: 'green.500' }}
                    />
                  </FormControl>

                  <FormControl flex={1}>
                    <FormLabel fontSize="sm" color="slate.300">
                      ID Number (Optional)
                    </FormLabel>
                    <Input
                      placeholder="License #"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      bg="slate.750"
                      borderColor="slate.600"
                      _hover={{ borderColor: 'slate.500' }}
                      _focus={{ borderColor: 'green.500' }}
                    />
                  </FormControl>
                </HStack>

                <Button
                  colorScheme="green"
                  size="lg"
                  leftIcon={<Icon as={UserIcon} boxSize={5} />}
                  onClick={handleManualVerify}
                  isDisabled={!customerName}
                >
                  Verify Customer
                </Button>
              </VStack>
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <Divider borderColor="slate.700" />

      {/* Skip Option - Budtender Only */}
      <Button
        variant="ghost"
        color="slate.500"
        onClick={handleSkip}
        size="sm"
      >
        Skip Verification (Quick Order)
      </Button>
    </VStack>
  );
}

export default StepScanID;
