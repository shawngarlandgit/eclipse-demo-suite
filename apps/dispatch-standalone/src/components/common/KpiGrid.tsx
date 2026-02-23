import { SimpleGrid } from '@chakra-ui/react';
import type { ComponentProps } from 'react';

type SimpleGridProps = ComponentProps<typeof SimpleGrid>;

interface KpiGridProps extends Omit<SimpleGridProps, 'columns' | 'minChildWidth'> {
  minChildWidth?: SimpleGridProps['minChildWidth'];
}

function KpiGrid({
  children,
  minChildWidth = { base: '170px', md: '210px', xl: '230px' },
  spacing = 5,
  ...rest
}: KpiGridProps) {
  return (
    <SimpleGrid minChildWidth={minChildWidth} spacing={spacing} {...rest}>
      {children}
    </SimpleGrid>
  );
}

export default KpiGrid;
