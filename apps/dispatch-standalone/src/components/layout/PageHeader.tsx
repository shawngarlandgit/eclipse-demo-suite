import { Box, HStack, Heading, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  mb?: number;
}

function PageHeader({ title, description, actions, mb = 4 }: PageHeaderProps) {
  return (
    <Box
      mb={mb}
      px={4}
      py={4}
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      bg="linear-gradient(180deg, rgba(36,30,58,0.88) 0%, rgba(26,31,43,0.88) 100%)"
      boxShadow="0 10px 30px rgba(0,0,0,0.2)"
      backdropFilter="blur(8px)"
    >
      <HStack justify="space-between" align="start" wrap="wrap" gap={3}>
        <Box>
          <Heading size="md" color="white" letterSpacing="0.01em">{title}</Heading>
          {description ? (
            <Text color="slate.300" fontSize="sm" mt={1}>{description}</Text>
          ) : null}
        </Box>
        {actions ? (
          <HStack spacing={2} wrap="wrap" justify="flex-end">
            {actions}
          </HStack>
        ) : null}
      </HStack>
    </Box>
  );
}

export default PageHeader;
