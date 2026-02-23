import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Image,
  Badge,
  Divider,
  Skeleton,
  Flex,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { useInventoryStore } from '../../../stores/inventoryStore';
import { useProduct } from '../../../hooks/useInventory';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import CannabinoidProfile from './CannabinoidProfile';
import StockLevelIndicator from './StockLevelIndicator';
import { inventoryService } from '../../../services/api/inventory.service';

/**
 * ProductDetailModal
 * Comprehensive modal displaying all product and strain information
 */
function ProductDetailModal() {
  const { isDetailModalOpen, closeDetailModal, selectedProductId } = useInventoryStore();
  const { data: product, isLoading } = useProduct(selectedProductId || '');

  if (!isDetailModalOpen) return null;

  const stockInfo = product
    ? inventoryService.getStockLevelInfo(
        product.quantity_on_hand,
        product.low_stock_threshold || product.reorder_level
      )
    : null;

  return (
    <Modal
      isOpen={isDetailModalOpen}
      onClose={closeDetailModal}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent bg="slate.800" borderColor="slate.700" borderWidth="1px" maxH="90vh">
        <ModalHeader color="white" borderBottom="1px" borderColor="slate.700">
          {isLoading ? (
            <Skeleton height="24px" width="200px" />
          ) : (
            <HStack spacing={3}>
              <Heading size="md">{product?.name}</Heading>
              <Badge
                bg={product?.is_active ? '#10B981' : '#EF4444'}
                color="white"
                px={3}
                py={1}
                borderRadius="md"
                fontSize="sm"
                fontWeight="bold"
              >
                {product?.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </HStack>
          )}
        </ModalHeader>
        <ModalCloseButton color="slate.400" />

        <ModalBody py={6}>
          {isLoading ? (
            <VStack spacing={4} align="stretch">
              <Skeleton height="200px" />
              <Skeleton height="100px" />
              <Skeleton height="150px" />
            </VStack>
          ) : product ? (
            <VStack spacing={6} align="stretch">
              {/* Product Image & Basic Info */}
              <Grid templateColumns={{ base: '1fr', md: '200px 1fr' }} gap={6}>
                <GridItem>
                  <Box
                    w="full"
                    h="200px"
                    bg="slate.700"
                    borderRadius="lg"
                    overflow="hidden"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {product.image_url ? (
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        objectFit="cover"
                        w="full"
                        h="full"
                      />
                    ) : (
                      <Text fontSize="6xl">🌿</Text>
                    )}
                  </Box>
                </GridItem>

                <GridItem>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontSize="sm" color="slate.400" mb={1}>
                        Product Type
                      </Text>
                      <Badge
                        bg="#8B5CF6"
                        color="white"
                        fontSize="md"
                        px={3}
                        py={1}
                        borderRadius="md"
                        fontWeight="bold"
                      >
                        {product.product_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </Box>

                    {product.strain_name && (
                      <Box>
                        <Text fontSize="sm" color="slate.400" mb={1}>
                          Strain Name
                        </Text>
                        <Text fontSize="lg" fontWeight="bold" color="white">
                          {product.strain_name}
                        </Text>
                      </Box>
                    )}

                    {product.sku && (
                      <Box>
                        <Text fontSize="sm" color="slate.400" mb={1}>
                          SKU
                        </Text>
                        <Text fontSize="md" color="slate.200" fontFamily="mono">
                          {product.sku}
                        </Text>
                      </Box>
                    )}

                    {product.vendor && (
                      <Box>
                        <Text fontSize="sm" color="slate.400" mb={1}>
                          Vendor
                        </Text>
                        <Text fontSize="md" color="white">
                          {product.vendor}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </GridItem>
              </Grid>

              <Divider borderColor="slate.700" />

              {/* Cannabinoid Profile */}
              <Box>
                <Heading size="sm" mb={3} color="white">
                  Cannabinoid Profile
                </Heading>
                <Box bg="slate.750" p={4} borderRadius="md">
                  <CannabinoidProfile
                    thc_pct={product.thc_pct}
                    cbd_pct={product.cbd_pct}
                    cbg_pct={product.cbg_pct}
                    thca_pct={product.thca_pct}
                    layout="vertical"
                    size="lg"
                  />
                </Box>
              </Box>

              <Divider borderColor="slate.700" />

              {/* Stock Information */}
              <Box>
                <Heading size="sm" mb={3} color="white">
                  Stock Information
                </Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  <Box bg="slate.750" p={4} borderRadius="md">
                    <Text fontSize="sm" color="slate.400" mb={2}>
                      Current Stock Level
                    </Text>
                    {stockInfo && (
                      <StockLevelIndicator
                        stockInfo={stockInfo}
                        quantity={product.quantity_on_hand}
                        showLabel={true}
                        size="md"
                      />
                    )}
                  </Box>

                  <Box bg="slate.750" p={4} borderRadius="md">
                    <VStack spacing={2} align="stretch">
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="slate.400">
                          Reorder Level
                        </Text>
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {product.reorder_level} units
                        </Text>
                      </Flex>
                      {product.low_stock_threshold && (
                        <Flex justify="space-between">
                          <Text fontSize="sm" color="slate.400">
                            Low Stock Threshold
                          </Text>
                          <Text fontSize="md" fontWeight="bold" color="white">
                            {product.low_stock_threshold} units
                          </Text>
                        </Flex>
                      )}
                      <Flex justify="space-between">
                        <Text fontSize="sm" color="slate.400">
                          Batch Count
                        </Text>
                        <Badge
                          bg="#6366F1"
                          color="white"
                          fontSize="sm"
                          px={2}
                          py={1}
                          borderRadius="md"
                          fontWeight="bold"
                        >
                          {product.batch_count} {product.batch_count === 1 ? 'batch' : 'batches'}
                        </Badge>
                      </Flex>
                    </VStack>
                  </Box>
                </Grid>
              </Box>

              <Divider borderColor="slate.700" />

              {/* Pricing Information */}
              <Box>
                <Heading size="sm" mb={3} color="white">
                  Pricing
                </Heading>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="slate.400">Type</Th>
                      <Th color="slate.400" isNumeric>Amount</Th>
                      <Th color="slate.400" isNumeric>Per Unit Value</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td color="slate.300">Retail Price</Td>
                      <Td color="white" fontWeight="bold" isNumeric>
                        {formatCurrency(product.price)}
                      </Td>
                      <Td color="white" isNumeric>
                        {formatCurrency(product.price * product.quantity_on_hand)}
                      </Td>
                    </Tr>
                    {product.cost && (
                      <>
                        <Tr>
                          <Td color="slate.300">Cost</Td>
                          <Td color="white" fontWeight="bold" isNumeric>
                            {formatCurrency(product.cost)}
                          </Td>
                          <Td color="white" isNumeric>
                            {formatCurrency(product.cost * product.quantity_on_hand)}
                          </Td>
                        </Tr>
                        <Tr bg="slate.750">
                          <Td color="slate.300" fontWeight="bold">Margin</Td>
                          <Td color="cannabis.400" fontWeight="bold" isNumeric>
                            {formatCurrency(product.price - product.cost)}
                          </Td>
                          <Td color="cannabis.400" fontWeight="bold" isNumeric>
                            {(((product.price - product.cost) / product.price) * 100).toFixed(1)}%
                          </Td>
                        </Tr>
                      </>
                    )}
                  </Tbody>
                </Table>
              </Box>

              <Divider borderColor="slate.700" />

              {/* Additional Information */}
              <Box>
                <Heading size="sm" mb={3} color="white">
                  Additional Information
                </Heading>
                <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                  {product.description && (
                    <GridItem colSpan={{ base: 1, md: 2 }}>
                      <Box bg="slate.750" p={4} borderRadius="md">
                        <Text fontSize="sm" color="slate.400" mb={2}>
                          Description
                        </Text>
                        <Text fontSize="sm" color="slate.200">
                          {product.description}
                        </Text>
                      </Box>
                    </GridItem>
                  )}

                  <Box bg="slate.750" p={4} borderRadius="md">
                    <Text fontSize="sm" color="slate.400" mb={2}>
                      Created
                    </Text>
                    <Text fontSize="sm" color="white">
                      {formatDate(product.created_at)}
                    </Text>
                  </Box>

                  {product.last_updated && (
                    <Box bg="slate.750" p={4} borderRadius="md">
                      <Text fontSize="sm" color="slate.400" mb={2}>
                        Last Updated
                      </Text>
                      <Text fontSize="sm" color="white">
                        {formatDate(product.last_updated)}
                      </Text>
                    </Box>
                  )}

                  {product.last_restocked && (
                    <Box bg="slate.750" p={4} borderRadius="md">
                      <Text fontSize="sm" color="slate.400" mb={2}>
                        Last Restocked
                      </Text>
                      <Text fontSize="sm" color="white">
                        {formatDate(product.last_restocked)}
                      </Text>
                    </Box>
                  )}
                </Grid>
              </Box>
            </VStack>
          ) : (
            <Box textAlign="center" py={12}>
              <Text color="slate.400">Product not found</Text>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ProductDetailModal;
