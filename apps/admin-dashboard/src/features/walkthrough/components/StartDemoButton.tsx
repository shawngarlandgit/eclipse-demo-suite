/**
 * Start Demo Button
 * Manual trigger button for the product tour
 */

import { Button, Icon, Tooltip } from '@chakra-ui/react';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useWalkthroughStore } from '../store/walkthroughStore';

interface StartDemoButtonProps {
  tourId?: 'compliance-risk-overview';
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  colorScheme?: string;
}

export function StartDemoButton({
  tourId = 'compliance-risk-overview',
  variant = 'outline',
  size = 'sm',
  showIcon = true,
  colorScheme = 'green',
}: StartDemoButtonProps) {
  const { startTour, isRunning, hasCompletedTour } = useWalkthroughStore();
  const hasCompleted = hasCompletedTour(tourId);

  const handleClick = () => {
    if (!isRunning) {
      startTour(tourId);
    }
  };

  const buttonText = hasCompleted ? 'Replay Demo' : 'Start Demo';
  const ButtonIcon = hasCompleted ? ArrowPathIcon : PlayIcon;

  return (
    <Tooltip
      label={
        isRunning
          ? 'Tour in progress...'
          : hasCompleted
          ? 'Watch the tour again'
          : 'Take a guided tour of this page'
      }
      hasArrow
    >
      <Button
        data-tour="start-demo-button"
        variant={variant}
        size={size}
        colorScheme={colorScheme}
        onClick={handleClick}
        isDisabled={isRunning}
        leftIcon={showIcon ? <Icon as={ButtonIcon} boxSize={4} /> : undefined}
      >
        {buttonText}
      </Button>
    </Tooltip>
  );
}
