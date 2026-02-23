/**
 * ActionButtons Component
 * Skip and Continue action buttons for the recommendations step
 */

import {
  HStack,
  Button,
  Icon,
} from '@chakra-ui/react';
import {
  ArrowRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import type { ActionButtonsProps } from './types';

export function ActionButtons({
  cartItemCount,
  isKiosk,
  onSkip,
  onContinue,
}: ActionButtonsProps) {
  return (
    <HStack spacing={4} justify="center">
      <Button
        variant="ghost"
        color="slate.400"
        leftIcon={<Icon as={XMarkIcon} boxSize={5} />}
        onClick={onSkip}
        size={isKiosk ? 'lg' : 'md'}
      >
        No Thanks, Browse All
      </Button>

      <Button
        colorScheme="green"
        rightIcon={<Icon as={ArrowRightIcon} boxSize={5} />}
        onClick={onContinue}
        size={isKiosk ? 'lg' : 'md'}
        px={8}
      >
        {cartItemCount > 0 ? 'Continue with Selection' : 'Browse Products'}
      </Button>
    </HStack>
  );
}

export default ActionButtons;
