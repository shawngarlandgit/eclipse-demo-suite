import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Skeleton,
  Image,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from '@chakra-ui/react';
import {
  EllipsisVerticalIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useProducts } from '../../../hooks/useInventory';
import { useInventoryStore } from '../../../stores/inventoryStore';
import { inventoryService } from '../../../services/api/inventory.service';
// import { mockInventoryService as inventoryService } from '../../../services/api/inventory-mock.service';
import { formatCurrency } from '../../../utils/formatters';
import StockLevelIndicator from './StockLevelIndicator';
import CannabinoidProfile from './CannabinoidProfile';
import BatchStatusBadge from './BatchStatusBadge';

/**
 * ProductsTable v2
 * Main products listing table with actions
 */
function ProductsTable() {
  const { productFilters, openDetailModal, openAdjustmentDrawer } =
    useInventoryStore();
  const { data: products, isLoading } = useProducts(productFilters);

  if (isLoading) {
    return (
      <Box>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height="60px" mb={2} borderRadius="md" />
        ))}
      </Box>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Box
        className="card"
        py={12}
        textAlign="center"
      >
        <Text color="slate.400">No products found</Text>
        <Text fontSize="sm" color="slate.500" mt={2}>
          Try adjusting your filters or add new products
        </Text>
      </Box>
    );
  }

  return (
    <Box className="card" overflowX="auto">
      <Table variant="simple" size="sm">
        <Thead>
          <Tr>
            <Th width="22%">Product</Th>
            <Th width="8%">Strain Type</Th>
            <Th width="10%">Category</Th>
            <Th width="12%">Cannabinoids</Th>
            <Th width="13%">Stock Level</Th>
            <Th width="10%">Price</Th>
            <Th width="10%">Batches</Th>
            <Th width="8%">Status</Th>
            <Th width="7%"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {products.map((product) => {
            const stockInfo = inventoryService.getStockLevelInfo(
              product.quantity_on_hand,
              product.low_stock_threshold
            );

            return (
              <Tr
                key={product.id}
                _hover={{ bg: 'slate.750', cursor: 'pointer' }}
                onClick={() => openDetailModal(product.id)}
              >
                {/* Product Info */}
                <Td>
                  <HStack spacing={3}>
                    <Box
                      w="40px"
                      h="40px"
                      bg="slate.700"
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      overflow="hidden"
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
                        <Text fontSize="xl">🌿</Text>
                      )}
                    </Box>
                    <VStack align="start" spacing={0} minW="0" flex="1">
                      <Text
                        fontWeight="medium"
                        color="white"
                        fontSize="sm"
                        whiteSpace="normal"
                        wordBreak="break-word"
                      >
                        {product.name}
                      </Text>
                      <Text fontSize="xs" color="slate.400" noOfLines={1}>
                        SKU: {product.sku}
                      </Text>
                    </VStack>
                  </HStack>
                </Td>

                {/* Strain Type */}
                <Td>
                  <Badge
                    bg={
                      product.strain_type === 'indica' ? '#9333EA' :
                      product.strain_type === 'sativa' ? '#F97316' :
                      product.strain_type === 'hybrid' ? '#06B6D4' :
                      product.strain_type?.toLowerCase().includes('indica') ? '#EC4899' :
                      product.strain_type?.toLowerCase().includes('sativa') ? '#EF4444' :
                      '#22D3EE'
                    }
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="md"
                    textTransform="uppercase"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {product.strain_type}
                  </Badge>
                </Td>

                {/* Category */}
                <Td>
                  <Text fontSize="sm" color="slate.300" textTransform="capitalize">
                    {product.product_type.replace('_', ' ')}
                  </Text>
                </Td>

                {/* Cannabinoids */}
                <Td>
                  <CannabinoidProfile
                    thc_pct={product.thc_pct}
                    cbd_pct={product.cbd_pct}
                    cbg_pct={product.cbg_pct}
                    thca_pct={product.thca_pct}
                    layout="horizontal"
                    size="sm"
                  />
                </Td>

                {/* Stock Level */}
                <Td>
                  <Box minW="200px">
                    <StockLevelIndicator
                      stockInfo={stockInfo}
                      quantity={product.quantity_on_hand}
                      showLabel={true}
                      size="sm"
                    />
                  </Box>
                </Td>

                {/* Price */}
                <Td>
                  <Text fontWeight="medium" color="white">
                    {formatCurrency(product.price)}
                  </Text>
                  {product.cost && (
                    <Text fontSize="xs" color="slate.400">
                      Cost: {formatCurrency(product.cost)}
                    </Text>
                  )}
                </Td>

                {/* Batches */}
                <Td>
                  <Badge
                    bg="#6366F1"
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {product.batch_count} {product.batch_count === 1 ? 'batch' : 'batches'}
                  </Badge>
                </Td>

                {/* Status */}
                <Td>
                  <Badge
                    bg={product.is_active ? '#10B981' : '#EF4444'}
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {product.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>

                {/* Actions */}
                <Td onClick={(e) => e.stopPropagation()}>
                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<EllipsisVerticalIcon className="w-5 h-5" />}
                      variant="ghost"
                      size="sm"
                      aria-label="Actions"
                    />
                    <MenuList>
                      <MenuItem
                        icon={<EyeIcon className="w-4 h-4" />}
                        onClick={() => openDetailModal(product.id)}
                      >
                        View Details
                      </MenuItem>
                      <MenuItem
                        icon={<PencilIcon className="w-4 h-4" />}
                        onClick={() => openAdjustmentDrawer(product.id)}
                      >
                        Adjust Stock
                      </MenuItem>
                      <MenuItem icon={<PlusIcon className="w-4 h-4" />}>
                        Add Batch
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}

export default ProductsTable;
