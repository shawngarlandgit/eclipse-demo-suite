import { HStack, Badge, Text, VStack, Tooltip } from '@chakra-ui/react';

interface CannabinoidProfileProps {
  thc_pct: number | null;
  cbd_pct: number | null;
  cbg_pct?: number | null;
  thca_pct?: number | null;
  layout?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md';
}

/**
 * CannabinoidProfile
 * Display cannabinoid percentages with color-coded badges
 */
function CannabinoidProfile({
  thc_pct,
  cbd_pct,
  cbg_pct,
  thca_pct,
  layout = 'horizontal',
  size = 'md',
}: CannabinoidProfileProps) {
  const Container = layout === 'horizontal' ? HStack : VStack;
  const fontSize = size === 'sm' ? 'xs' : 'sm';

  const cannabinoids = [
    { label: 'THC', value: thc_pct, color: 'purple' },
    { label: 'CBD', value: cbd_pct, color: 'green' },
    { label: 'CBG', value: cbg_pct, color: 'blue' },
    { label: 'THCA', value: thca_pct, color: 'violet' },
  ].filter((c) => c.value !== null && c.value !== undefined);

  if (cannabinoids.length === 0) {
    return (
      <Text fontSize="xs" color="slate.500" fontStyle="italic">
        No test data
      </Text>
    );
  }

  return (
    <Container spacing={2} align={layout === 'horizontal' ? 'center' : 'start'}>
      {cannabinoids.map((cannabinoid) => (
        <Tooltip
          key={cannabinoid.label}
          label={`${cannabinoid.label}: ${cannabinoid.value}%`}
          placement="top"
        >
          <Badge
            colorScheme={cannabinoid.color}
            variant="subtle"
            fontSize={fontSize}
            px={2}
            py={0.5}
            borderRadius="md"
          >
            {cannabinoid.label} {cannabinoid.value}%
          </Badge>
        </Tooltip>
      ))}
    </Container>
  );
}

export default CannabinoidProfile;
