import { Box, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

type KpiTone =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'info'
  | 'critical'
  | 'secondary';

interface KpiStatCardProps {
  label: string;
  value: ReactNode;
  tone?: KpiTone;
}

const TONE_COLORS: Record<KpiTone, string> = {
  default: 'white',
  accent: 'orange.500',
  success: 'teal.300',
  warning: 'orange.400',
  info: 'teal.200',
  critical: 'red.400',
  secondary: 'orange.300',
};

function KpiStatCard({ label, value, tone = 'default' }: KpiStatCardProps) {
  return (
    <Box
      bg="linear-gradient(180deg, rgba(38,31,62,0.92) 0%, rgba(23,30,41,0.92) 100%)"
      border="1px solid"
      borderColor="whiteAlpha.200"
      borderRadius="2xl"
      px={4}
      py={4}
      minH="96px"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      gap={2}
      alignItems="flex-start"
      textAlign="left"
      boxShadow="0 10px 30px rgba(0,0,0,0.22)"
    >
      <Text color="slate.300" fontSize="xs" fontWeight="bold" lineHeight="1.2" letterSpacing="0.08em" textTransform="uppercase">
        {label}
      </Text>
      <Text color={TONE_COLORS[tone]} fontSize={{ base: 'xl', xl: '2xl' }} lineHeight="1" fontWeight="extrabold">
        {value}
      </Text>
    </Box>
  );
}

export default KpiStatCard;
