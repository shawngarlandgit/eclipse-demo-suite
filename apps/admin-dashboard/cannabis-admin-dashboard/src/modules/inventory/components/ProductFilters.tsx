import {
  HStack,
  Input,
  Select,
  Button,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useInventoryStore } from '../../../stores/inventoryStore';
import { PRODUCT_TYPES } from '../../../utils/constants';

/**
 * ProductFilters
 * Filter controls for product list
 */
function ProductFilters() {
  const { productFilters, setProductFilters, resetProductFilters } =
    useInventoryStore();

  return (
    <HStack spacing={4} mb={6} flexWrap="wrap">
      {/* Search */}
      <InputGroup maxW="300px">
        <InputLeftElement pointerEvents="none">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
        </InputLeftElement>
        <Input
          placeholder="Search products..."
          value={productFilters.search}
          onChange={(e) => setProductFilters({ search: e.target.value })}
          className="input-field"
        />
      </InputGroup>

      {/* Category Filter */}
      <Select
        value={productFilters.category}
        onChange={(e) => setProductFilters({ category: e.target.value as any })}
        maxW="200px"
        className="input-field"
      >
        <option value="all">All Categories</option>
        {PRODUCT_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </Select>

      {/* Status Filter */}
      <Select
        value={productFilters.status}
        onChange={(e) =>
          setProductFilters({ status: e.target.value as any })
        }
        maxW="150px"
        className="input-field"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>

      {/* Stock Level Filter */}
      <Select
        value={productFilters.stockLevel}
        onChange={(e) =>
          setProductFilters({ stockLevel: e.target.value as any })
        }
        maxW="150px"
        className="input-field"
      >
        <option value="all">All Stock Levels</option>
        <option value="critical">Critical</option>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </Select>

      {/* Reset Button */}
      <Button variant="ghost" size="sm" onClick={resetProductFilters}>
        Reset
      </Button>
    </HStack>
  );
}

export default ProductFilters;
