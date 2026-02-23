/**
 * Step: Select Products
 * Product selection with search and cart management
 * - Reuses existing inventory data (read-only)
 * - Local cart state managed by OrderContext
 * - Shows AI recommendations for out-of-stock strains
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Badge,
  Icon,
  IconButton,
  Flex,
  Skeleton,
  Divider,
  Alert,
} from '@chakra-ui/react';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useOrder } from '../OrderContext';
import { useProducts } from '../../../../hooks/useInventory';
import { formatCurrency } from '../../../../utils/formatters';
import type { ProductWithInventory } from '../../types';
import RecommendationPanel from '../components/RecommendationPanel';

function StepSelectProducts() {
  const { state, addToCart, updateQuantity, removeFromCart, nextStep, prevStep } = useOrder();
  const isKiosk = state.mode === 'kiosk';

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [outOfStockStrain, setOutOfStockStrain] = useState<string | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Fetch products from inventory (read-only)
  const { data: products, isLoading } = useProducts({ status: 'active' });

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        product.strain_name?.toLowerCase().includes(query) ||
        product.product_type.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Track added products for recommendation cards
  const addedProductIds = new Set(state.cart.map(item => item.product.id));

  // Generate "You Might Also Like" suggestions based on cart contents
  const suggestedProducts = useMemo(() => {
    if (!products || products.length === 0 || state.cart.length === 0) return [];

    // Get product types and IDs already in cart
    const cartProductTypes = new Set(state.cart.map(item => item.product.product_type));
    const cartProductIds = new Set(state.cart.map(item => item.product.id));


    // Complementary product type suggestions
    const complementaryTypes: Record<string, string[]> = {
      'flower': ['pre-roll', 'vape', 'edible', 'extract'],
      'pre-roll': ['flower', 'vape', 'edible'],
      'vape': ['flower', 'edible', 'extract', 'pre-roll'],
      'edible': ['flower', 'tincture', 'topical', 'vape'],
      'extract': ['vape', 'flower', 'edible'],
      'tincture': ['edible', 'topical', 'flower'],
      'topical': ['tincture', 'edible', 'flower'],
      'other': ['flower', 'edible', 'vape', 'pre-roll'],
    };

    // Find suggested types based on cart
    const suggestedTypes = new Set<string>();
    cartProductTypes.forEach(type => {
      const complements = complementaryTypes[type] || complementaryTypes['other'];
      complements.forEach(t => {
        if (!cartProductTypes.has(t)) {
          suggestedTypes.add(t);
        }
      });
    });


    // Get products from suggested types (not already in cart)
    let suggestions = products.filter(p =>
      suggestedTypes.has(p.product_type) &&
      !cartProductIds.has(p.id)
    );


    // If no complementary products, fall back to ANY products not in cart
    if (suggestions.length === 0) {
      suggestions = products.filter(p => !cartProductIds.has(p.id));
    }

    // Return up to 4 suggestions, prioritizing variety of types
    const result: ProductWithInventory[] = [];
    const usedTypes = new Set<string>();

    // First pass: one of each type
    for (const product of suggestions) {
      if (result.length >= 4) break;
      if (!usedTypes.has(product.product_type)) {
        result.push(product);
        usedTypes.add(product.product_type);
      }
    }

    // Second pass: fill remaining slots
    for (const product of suggestions) {
      if (result.length >= 4) break;
      if (!result.includes(product)) {
        result.push(product);
      }
    }

    return result;
  }, [products, state.cart]);

  // Detect out-of-stock strain searches
  useEffect(() => {
    // Only check when we have a meaningful search with no results
    if (!searchQuery.trim() || searchQuery.length < 3 || filteredProducts.length > 0) {
      setOutOfStockStrain(null);
      setShowRecommendations(false);
      return;
    }

    // Check if this looks like a strain name search
    // We consider it a strain search if:
    // 1. No products match AND
    // 2. Search is at least 3 chars (to avoid triggering on short searches)
    const query = searchQuery.trim();

    // Simple heuristic: if the search looks like a proper noun (capitalized)
    // or contains common strain words, treat it as a potential strain
    const looksLikeStrainName = /^[A-Z]/.test(query) ||
      query.toLowerCase().split(' ').some(word =>
        ['og', 'kush', 'haze', 'widow', 'diesel', 'purple', 'blue', 'green', 'white', 'jack', 'cheese', 'skunk', 'sour', 'sweet', 'lemon', 'grape', 'mango', 'pineapple', 'strawberry', 'cookie', 'cookies', 'cake', 'runtz', 'gelato', 'zkittlez', 'gorilla', 'glue', 'goat', 'dream', 'star', 'fire'].includes(word.toLowerCase())
      );

    if (looksLikeStrainName) {
      setOutOfStockStrain(query);
      setShowRecommendations(true);
    }
  }, [searchQuery, filteredProducts]);

  // Handle adding recommended product to cart
  const handleAddRecommendation = (productId: string) => {
    if (!products) return;

    const product = products.find(p => p.id === productId);
    if (product) {
      addToCart(product);
    }
  };

  // Get cart quantity for a product
  const getCartQuantity = (productId: string): number => {
    const item = state.cart.find((i) => i.product.id === productId);
    return item?.quantity || 0;
  };

  // Handle quantity change
  const handleQuantityChange = (product: ProductWithInventory, delta: number) => {
    const currentQty = getCartQuantity(product.id);
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      removeFromCart(product.id);
    } else if (currentQty === 0) {
      addToCart(product);
    } else {
      updateQuantity(product.id, newQty);
    }
  };

  return (
    <VStack spacing={4} align="stretch" h="full">
      {/* Header with Search */}
      <HStack spacing={4}>
        <InputGroup flex={1}>
          <InputLeftElement pointerEvents="none">
            <Icon as={MagnifyingGlassIcon} color="slate.400" boxSize={5} />
          </InputLeftElement>
          <Input
            placeholder="Search products by name, SKU, or strain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg="slate.800"
            borderColor="slate.600"
            _hover={{ borderColor: 'slate.500' }}
            _focus={{ borderColor: 'green.500' }}
            size={isKiosk ? 'lg' : 'md'}
          />
        </InputGroup>

        {/* Cart Summary Button */}
        <Button
          leftIcon={<Icon as={ShoppingCartIcon} boxSize={5} />}
          colorScheme={state.cart.length > 0 ? 'green' : 'gray'}
          variant="outline"
          size={isKiosk ? 'lg' : 'md'}
        >
          {state.totals.itemCount} items
        </Button>
      </HStack>

      {/* Product Grid and Cart Split View */}
      <Flex gap={4} flex={1} minH="300px">
        {/* Products List */}
        <Box flex={2} overflowY="auto" maxH="400px">
          {isLoading ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} height="80px" borderRadius="md" />
              ))}
            </SimpleGrid>
          ) : filteredProducts.length === 0 ? (
            <VStack spacing={4} py={4} align="stretch">
              {/* Out of stock message */}
              {outOfStockStrain ? (
                <Alert
                  status="warning"
                  variant="subtle"
                  borderRadius="md"
                  bg="orange.900"
                  borderColor="orange.700"
                  border="1px"
                >
                  <Icon as={ExclamationTriangleIcon} boxSize={5} color="orange.400" mr={2} />
                  <Text color="white" fontSize="sm">
                    <Text as="span" fontWeight="bold">"{outOfStockStrain}"</Text> isn't currently in stock
                  </Text>
                </Alert>
              ) : (
                <Box textAlign="center">
                  <Text color="slate.400">
                    {searchQuery ? 'No products match your search' : 'No products available'}
                  </Text>
                </Box>
              )}

              {/* Show similar strain recommendations */}
              {showRecommendations && outOfStockStrain && (
                <RecommendationPanel
                  context="out_of_stock"
                  requestedStrain={outOfStockStrain}
                  title={`Similar to "${outOfStockStrain}"`}
                  onAddToCart={handleAddRecommendation}
                  onDismiss={() => setShowRecommendations(false)}
                  addedProductIds={addedProductIds}
                />
              )}
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              {filteredProducts.map((product) => {
                const cartQty = getCartQuantity(product.id);
                const inCart = cartQty > 0;

                return (
                  <Box
                    key={product.id}
                    p={3}
                    bg={inCart ? 'green.900' : 'slate.800'}
                    borderRadius="md"
                    border="1px"
                    borderColor={inCart ? 'green.600' : 'slate.700'}
                    transition="all 0.2s"
                  >
                    <Flex justify="space-between" align="start">
                      <VStack align="start" spacing={1} flex={1} minW={0}>
                        <Text
                          fontWeight="medium"
                          color="white"
                          fontSize="sm"
                          noOfLines={1}
                        >
                          {product.name}
                        </Text>
                        <HStack spacing={2}>
                          <Badge
                            size="sm"
                            colorScheme="purple"
                            fontSize="xs"
                          >
                            {product.product_type.replace('_', ' ')}
                          </Badge>
                          {'strain_type' in product && (product as { strain_type?: string }).strain_type && (
                            <Badge
                              size="sm"
                              colorScheme={
                                (product as { strain_type?: string }).strain_type === 'indica'
                                  ? 'purple'
                                  : (product as { strain_type?: string }).strain_type === 'sativa'
                                  ? 'orange'
                                  : 'cyan'
                              }
                              fontSize="xs"
                            >
                              {(product as { strain_type?: string }).strain_type as string}
                            </Badge>
                          )}
                        </HStack>
                        <Text fontWeight="bold" color="green.400">
                          {formatCurrency(product.price)}
                        </Text>
                      </VStack>

                      {/* Quantity Controls */}
                      <HStack spacing={1}>
                        {inCart && (
                          <>
                            <IconButton
                              aria-label="Decrease quantity"
                              icon={<MinusIcon className="w-4 h-4" />}
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => handleQuantityChange(product, -1)}
                            />
                            <Text
                              minW="30px"
                              textAlign="center"
                              fontWeight="bold"
                              color="white"
                            >
                              {cartQty}
                            </Text>
                          </>
                        )}
                        <IconButton
                          aria-label="Increase quantity"
                          icon={<PlusIcon className="w-4 h-4" />}
                          size="sm"
                          colorScheme="green"
                          onClick={() => handleQuantityChange(product, 1)}
                        />
                      </HStack>
                    </Flex>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </Box>

        {/* Cart Panel */}
        <Box
          flex={1}
          bg="slate.800"
          borderRadius="md"
          p={3}
          border="1px"
          borderColor="slate.700"
          minW="250px"
        >
          <Text fontWeight="bold" color="white" mb={3}>
            <Icon as={ShoppingCartIcon} boxSize={4} mr={2} />
            Cart
          </Text>

          {state.cart.length === 0 ? (
            <Text color="slate.500" fontSize="sm" textAlign="center" py={4}>
              No items in cart
            </Text>
          ) : (
            <VStack spacing={2} align="stretch" maxH="280px" overflowY="auto">
              {state.cart.map((item) => (
                <HStack
                  key={item.product.id}
                  justify="space-between"
                  p={2}
                  bg="slate.750"
                  borderRadius="sm"
                >
                  <VStack align="start" spacing={0} flex={1} minW={0}>
                    <Text fontSize="sm" color="white" noOfLines={1}>
                      {item.product.name}
                    </Text>
                    <Text fontSize="xs" color="slate.400">
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </Text>
                  </VStack>
                  <HStack>
                    <Text fontSize="sm" fontWeight="bold" color="green.400">
                      {formatCurrency(item.lineTotal)}
                    </Text>
                    <IconButton
                      aria-label="Remove item"
                      icon={<TrashIcon className="w-3 h-3" />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => removeFromCart(item.product.id)}
                    />
                  </HStack>
                </HStack>
              ))}
            </VStack>
          )}

          {state.cart.length > 0 && (
            <>
              <Divider my={3} borderColor="slate.600" />
              <VStack spacing={1} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="slate.400">
                    Subtotal
                  </Text>
                  <Text fontSize="sm" color="white">
                    {formatCurrency(state.totals.subtotal)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm" color="slate.400">
                    Tax ({(state.totals.taxRate * 100).toFixed(0)}%)
                  </Text>
                  <Text fontSize="sm" color="white">
                    {formatCurrency(state.totals.taxAmount)}
                  </Text>
                </HStack>
                <Divider my={1} borderColor="slate.600" />
                <HStack justify="space-between">
                  <Text fontWeight="bold" color="white">
                    Total
                  </Text>
                  <Text fontWeight="bold" color="green.400" fontSize="lg">
                    {formatCurrency(state.totals.total)}
                  </Text>
                </HStack>
              </VStack>
            </>
          )}
        </Box>
      </Flex>

      {/* You Might Also Like - Shows when cart has items */}
      {suggestedProducts.length > 0 && (
        <Box
          bg="slate.800"
          borderRadius="lg"
          p={4}
          border="1px"
          borderColor="purple.700"
        >
          <HStack spacing={2} mb={3}>
            <Icon as={SparklesIcon} boxSize={5} color="purple.400" />
            <Text fontWeight="bold" color="white">You Might Also Like</Text>
            <Badge colorScheme="purple" fontSize="xs">Complementary</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
            {suggestedProducts.map((product) => {
              const isAdded = addedProductIds.has(product.id);
              return (
                <Box
                  key={product.id}
                  bg={isAdded ? 'green.900' : 'slate.750'}
                  borderRadius="md"
                  p={3}
                  border="1px"
                  borderColor={isAdded ? 'green.600' : 'slate.600'}
                  transition="all 0.2s"
                  _hover={{ borderColor: isAdded ? 'green.500' : 'purple.500' }}
                >
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="medium" color="white" fontSize="sm" noOfLines={1}>
                      {product.name}
                    </Text>
                    <HStack spacing={1}>
                      <Badge
                        size="sm"
                        colorScheme="blue"
                        fontSize="xs"
                        textTransform="capitalize"
                      >
                        {product.product_type?.replace('-', ' ') || 'other'}
                      </Badge>
                      {'strain_type' in product && (product as { strain_type?: string }).strain_type && (
                        <Badge
                          size="sm"
                          colorScheme={
                            (product as { strain_type?: string }).strain_type === 'indica' ? 'purple' :
                            (product as { strain_type?: string }).strain_type === 'sativa' ? 'orange' : 'cyan'
                          }
                          fontSize="xs"
                        >
                          {(product as { strain_type?: string }).strain_type as string}
                        </Badge>
                      )}
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="bold" color="green.400" fontSize="sm">
                        {formatCurrency(product.price)}
                      </Text>
                      <IconButton
                        aria-label="Add to cart"
                        icon={isAdded ? <Icon as={MinusIcon} boxSize={4} /> : <Icon as={PlusIcon} boxSize={4} />}
                        size="xs"
                        colorScheme={isAdded ? 'red' : 'green'}
                        onClick={() => isAdded ? removeFromCart(product.id) : addToCart(product)}
                      />
                    </HStack>
                  </VStack>
                </Box>
              );
            })}
          </SimpleGrid>
        </Box>
      )}

      {/* Navigation */}
      <HStack justify="space-between" pt={2}>
        <Button variant="ghost" onClick={prevStep}>
          Back
        </Button>
        <Button
          colorScheme="green"
          size={isKiosk ? 'lg' : 'md'}
          onClick={nextStep}
          isDisabled={state.cart.length === 0}
        >
          Review Order
        </Button>
      </HStack>
    </VStack>
  );
}

export default StepSelectProducts;
