import { Badge } from '@chakra-ui/react';
import type { BadgeProps } from '@chakra-ui/react';

type StatusTone = 'default' | 'pending' | 'active' | 'success' | 'offline' | 'warning' | 'critical';

interface StatusPillProps extends Omit<BadgeProps, 'variant' | 'colorScheme'> {
  tone?: StatusTone;
}

const TONE_STYLES: Record<StatusTone, { bg: string; color: string; borderColor: string }> = {
  default: { bg: 'slate.800', color: 'slate.200', borderColor: 'slate.600' },
  pending: { bg: 'brand.900', color: 'brand.200', borderColor: 'brand.700' },
  active: { bg: 'ops.700', color: 'ops.300', borderColor: 'ops.600' },
  success: { bg: 'ops.700', color: 'ops.300', borderColor: 'ops.600' },
  offline: { bg: 'slate.800', color: 'slate.300', borderColor: 'slate.600' },
  warning: { bg: 'brand.900', color: 'brand.200', borderColor: 'brand.700' },
  critical: { bg: 'red.900', color: 'red.200', borderColor: 'red.700' },
};

function StatusPill({ tone = 'default', children, ...rest }: StatusPillProps) {
  const style = TONE_STYLES[tone];
  return (
    <Badge
      variant="subtle"
      bg={style.bg}
      color={style.color}
      borderColor={style.borderColor}
      borderWidth="1px"
      {...rest}
    >
      {children}
    </Badge>
  );
}

export default StatusPill;
