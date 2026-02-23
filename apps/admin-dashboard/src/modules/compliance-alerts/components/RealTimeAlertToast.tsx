/**
 * Real-Time Alert Toast
 * Toast notifications for new OCP advisories and compliance alerts
 */

import { useEffect, useRef } from "react";
import {
  useToast,
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Icon,
  CloseButton,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
  BellAlertIcon,
} from "@heroicons/react/24/solid";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { SEVERITY_CONFIG } from "../types";
import type { AdvisorySeverity } from "../types";
import type { Id } from "@convex/_generated/dataModel";

interface RealTimeAlertToastProps {
  dispensaryId?: Id<"dispensaries">;
  onViewAlert?: (advisoryId: Id<"ocpAdvisories">) => void;
  enabled?: boolean;
}

/**
 * Component that listens for new alerts and shows toast notifications
 * Uses Convex's real-time subscriptions
 */
export function RealTimeAlertToast({
  dispensaryId,
  onViewAlert,
  enabled = true,
}: RealTimeAlertToastProps) {
  const toast = useToast();
  const processedAlertsRef = useRef<Set<string>>(new Set());

  // Subscribe to active alerts for this dispensary
  const activeAlerts = useQuery(
    api.complianceAlerts.getActiveAlertsForDispensary,
    dispensaryId ? { dispensaryId } : "skip"
  );

  // Track and show toasts for new alerts
  useEffect(() => {
    if (!enabled || !activeAlerts) return;

    activeAlerts.forEach((alert) => {
      const alertKey = `${alert.advisoryId}-${alert.matchId}`;

      // Only show toast for alerts we haven't seen
      if (!processedAlertsRef.current.has(alertKey)) {
        processedAlertsRef.current.add(alertKey);

        // Don't show toast on initial load (only for truly new alerts)
        // We use a simple heuristic: if the alert was created in the last 30 seconds
        const isNewAlert = Date.now() - alert.createdAt < 30000;

        if (isNewAlert) {
          showAlertToast(
            toast,
            {
              advisoryId: alert.advisoryId,
              title: alert.advisoryTitle,
              severity: alert.severity,
              productName: alert.productName,
              matchType: alert.matchType,
            },
            onViewAlert
          );
        }
      }
    });
  }, [activeAlerts, enabled, toast, onViewAlert]);

  // Clean up old processed alerts periodically (memory management)
  useEffect(() => {
    const interval = setInterval(() => {
      // Keep only recent alerts (last 5 minutes)
      if (processedAlertsRef.current.size > 100) {
        processedAlertsRef.current.clear();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return null; // This component doesn't render anything
}

interface AlertToastData {
  advisoryId: Id<"ocpAdvisories">;
  title: string;
  severity: AdvisorySeverity;
  productName?: string;
  matchType?: string;
}

function showAlertToast(
  toast: ReturnType<typeof useToast>,
  data: AlertToastData,
  onViewAlert?: (advisoryId: Id<"ocpAdvisories">) => void
) {
  const severityConfig = SEVERITY_CONFIG[data.severity];

  toast({
    position: "top-right",
    duration: data.severity === "critical" ? null : 10000, // Critical alerts don't auto-dismiss
    isClosable: true,
    render: ({ onClose }) => (
      <AlertToastContent
        data={data}
        severityConfig={severityConfig}
        onClose={onClose}
        onViewAlert={onViewAlert}
      />
    ),
  });

  // Play sound for critical/high severity alerts
  if (data.severity === "critical" || data.severity === "high") {
    playAlertSound(data.severity);
  }
}

interface AlertToastContentProps {
  data: AlertToastData;
  severityConfig: (typeof SEVERITY_CONFIG)[AdvisorySeverity];
  onClose: () => void;
  onViewAlert?: (advisoryId: Id<"ocpAdvisories">) => void;
}

function AlertToastContent({
  data,
  severityConfig,
  onClose,
  onViewAlert,
}: AlertToastContentProps) {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor =
    data.severity === "critical"
      ? "red.500"
      : data.severity === "high"
      ? "orange.500"
      : data.severity === "medium"
      ? "yellow.500"
      : "blue.500";

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      shadow="lg"
      borderLeft="4px solid"
      borderLeftColor={borderColor}
      p={4}
      maxW="400px"
    >
      <HStack justify="space-between" align="start" mb={2}>
        <HStack spacing={2}>
          <Icon
            as={
              data.severity === "critical"
                ? ShieldExclamationIcon
                : data.severity === "high"
                ? ExclamationTriangleIcon
                : BellAlertIcon
            }
            color={borderColor}
            boxSize={5}
          />
          <Badge
            colorScheme={
              data.severity === "critical"
                ? "red"
                : data.severity === "high"
                ? "orange"
                : data.severity === "medium"
                ? "yellow"
                : "blue"
            }
          >
            {severityConfig.label} Alert
          </Badge>
        </HStack>
        <CloseButton size="sm" onClick={onClose} />
      </HStack>

      <VStack align="stretch" spacing={2}>
        <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
          {data.title}
        </Text>

        {data.productName && (
          <HStack fontSize="xs" color="gray.500">
            <Text>Affected Product:</Text>
            <Text fontWeight="medium" color="gray.700">
              {data.productName}
            </Text>
          </HStack>
        )}

        {data.matchType && (
          <Text fontSize="xs" color="gray.500">
            Match type: {data.matchType.replace("_", " ")}
          </Text>
        )}

        <HStack spacing={2} mt={2}>
          {onViewAlert && (
            <Button
              size="sm"
              colorScheme={data.severity === "critical" ? "red" : "blue"}
              onClick={() => {
                onViewAlert(data.advisoryId);
                onClose();
              }}
            >
              View Details
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            Dismiss
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}

/**
 * Play alert sound based on severity
 * Uses Web Audio API for cross-browser compatibility
 */
function playAlertSound(severity: AdvisorySeverity) {
  try {
    const audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Different tones for different severities
    if (severity === "critical") {
      // Urgent double beep
      oscillator.frequency.value = 880; // A5
      oscillator.type = "square";
      gainNode.gain.value = 0.1;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        // Second beep
        const osc2 = audioContext.createOscillator();
        osc2.connect(gainNode);
        osc2.frequency.value = 880;
        osc2.type = "square";
        osc2.start();
        setTimeout(() => osc2.stop(), 150);
      }, 200);
    } else {
      // Single gentle beep for high
      oscillator.frequency.value = 523; // C5
      oscillator.type = "sine";
      gainNode.gain.value = 0.05;

      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    }
  } catch {
    // Audio not supported or blocked
    console.log("Alert sound not available");
  }
}

/**
 * Hook to manage alert toast settings
 */
export function useAlertToastSettings() {
  // Could be extended to load from localStorage or user preferences
  return {
    enabled: true,
    soundEnabled: true,
    criticalOnly: false,
  };
}
