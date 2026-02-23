import { Box, Card, CardBody, Flex, Grid, HStack, Stat, VStack } from '@chakra-ui/react';
import type { CardProps, BoxProps, FlexProps, GridProps, StackProps, StatProps } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface DispatchPanelProps extends CardProps {
  children: ReactNode;
}

function DispatchPanel({ children, ...rest }: DispatchPanelProps) {
  return (
    <Card
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      bg="linear-gradient(180deg, rgba(38,31,62,0.94) 0%, rgba(27,33,43,0.94) 100%)"
      boxShadow="0 12px 40px rgba(0,0,0,0.28)"
      backdropFilter="blur(8px)"
      {...rest}
    >
      <CardBody>{children}</CardBody>
    </Card>
  );
}

interface DispatchListCardProps extends BoxProps {
  children: ReactNode;
}

function DispatchListCard({ children, ...rest }: DispatchListCardProps) {
  return (
    <Box
      p={3}
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      bg="linear-gradient(180deg, rgba(28,22,48,0.92) 0%, rgba(22,30,40,0.92) 100%)"
      boxShadow="0 8px 24px rgba(0,0,0,0.22)"
      _hover={{ borderColor: 'orange.400', transform: 'translateY(-1px)' }}
      transition="all 0.2s ease"
      {...rest}
    >
      {children}
    </Box>
  );
}

function DispatchStatTile(props: StatProps) {
  return (
    <Stat
      size="sm"
      bg="linear-gradient(180deg, rgba(37,32,58,0.86) 0%, rgba(25,30,43,0.86) 100%)"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="xl"
      p={3}
      boxShadow="inset 0 1px 0 rgba(255,255,255,0.08)"
      {...props}
    />
  );
}

function DispatchRow(props: FlexProps) {
  return <Flex {...props} />;
}

function DispatchInline(props: StackProps) {
  return <HStack {...props} />;
}

function DispatchStack(props: StackProps) {
  return <VStack {...props} />;
}

function DispatchEmptyState({ children, ...rest }: FlexProps) {
  return (
    <Flex direction="column" align="center" justify="center" py={10} {...rest}>
      {children}
    </Flex>
  );
}

function DispatchStatGrid(props: GridProps) {
  return <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={3} mt={4} {...props} />;
}

export {
  DispatchPanel,
  DispatchListCard,
  DispatchStatTile,
  DispatchRow,
  DispatchInline,
  DispatchStack,
  DispatchEmptyState,
  DispatchStatGrid,
};
