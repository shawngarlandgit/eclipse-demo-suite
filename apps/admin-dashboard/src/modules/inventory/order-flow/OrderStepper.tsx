/**
 * Order Stepper
 * Main component for the order flow system
 * Supports both Budtender and Kiosk modes
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
} from '@chakra-ui/react';
import { OrderProvider, useOrder } from './OrderContext';
import type { OrderMode } from './types';

// Layout components
import BudtenderLayout from './ui/BudtenderLayout';
import KioskLayout from './ui/KioskLayout';

// Step components
import StepScanID from './steps/StepScanID';
import StepRecommendations from './steps/StepRecommendations';
import StepSelectProducts from './steps/StepSelectProducts';
import StepConfirm from './steps/StepConfirm';
import StepComplete from './steps/StepComplete';

// ============================================================================
// STEP RENDERER
// ============================================================================

interface StepRendererProps {
  onClose: () => void;
}

function StepRenderer({ onClose }: StepRendererProps) {
  const { state } = useOrder();

  switch (state.currentStep) {
    case 'scan_id':
      return <StepScanID />;
    case 'recommendations':
      return <StepRecommendations />;
    case 'select_products':
      return <StepSelectProducts />;
    case 'confirm':
      return <StepConfirm />;
    case 'complete':
      return <StepComplete onClose={onClose} />;
    default:
      return <StepScanID />;
  }
}

// ============================================================================
// ORDER STEPPER CONTENT
// ============================================================================

interface OrderStepperContentProps {
  onClose: () => void;
}

function OrderStepperContent({ onClose }: OrderStepperContentProps) {
  const { state } = useOrder();

  // Select layout based on mode
  const Layout = state.mode === 'kiosk' ? KioskLayout : BudtenderLayout;

  return (
    <Layout onClose={onClose}>
      <StepRenderer onClose={onClose} />
    </Layout>
  );
}

// ============================================================================
// ORDER STEPPER (MODAL VERSION - FOR BUDTENDER)
// ============================================================================

interface OrderStepperModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: OrderMode;
}

export function OrderStepperModal({
  isOpen,
  onClose,
  mode = 'budtender',
}: OrderStepperModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      closeOnOverlayClick={false}
      closeOnEsc={mode === 'budtender'}
      isCentered
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
      <ModalContent bg="transparent" boxShadow="none" maxW="900px">
        <ModalBody p={0}>
          <OrderProvider initialMode={mode}>
            <OrderStepperContent onClose={onClose} />
          </OrderProvider>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

// ============================================================================
// ORDER STEPPER (FULLSCREEN VERSION - FOR KIOSK)
// ============================================================================

interface OrderStepperFullscreenProps {
  onClose?: () => void;
}

export function OrderStepperFullscreen({ onClose }: OrderStepperFullscreenProps) {
  const handleClose = () => {
    // In kiosk mode, closing just resets the order
    onClose?.();
  };

  return (
    <OrderProvider initialMode="kiosk">
      <OrderStepperContent onClose={handleClose} />
    </OrderProvider>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

// Default export is the modal version for easy integration
export default OrderStepperModal;
