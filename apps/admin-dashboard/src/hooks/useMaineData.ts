import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";

/**
 * Hook to get Maine cannabis market statistics
 */
export function useMaineMarketStats() {
  const data = useQuery(api.maineData.getMarketStats);

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to get Maine regulations
 */
export function useMaineRegulations(category?: string) {
  const data = useQuery(api.maineData.listRegulations, {
    category,
  });

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to get Maine medical dispensaries
 */
export function useMaineMedicalDispensaries(options?: {
  status?: string;
  city?: string;
  limit?: number;
}) {
  const data = useQuery(api.maineData.listMedicalDispensaries, {
    status: options?.status,
    city: options?.city,
    limit: options?.limit,
  });

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to get Maine compliance violations
 */
export function useMaineViolations(options?: {
  programType?: "medical" | "adult_use";
  limit?: number;
}) {
  const data = useQuery(api.maineData.listViolations, {
    programType: options?.programType,
    limit: options?.limit,
  });

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to get recent violations (last N days)
 */
export function useRecentViolations(days?: number) {
  const data = useQuery(api.maineData.getRecentViolations, {
    days,
  });

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to verify a Maine cannabis license
 */
export function useVerifyLicense(registrationNumber: string | null) {
  const data = useQuery(
    api.maineData.verifyLicense,
    registrationNumber ? { registrationNumber } : "skip"
  );

  return {
    data,
    isLoading: data === undefined && registrationNumber !== null,
  };
}

/**
 * Hook to get Maine sales trends
 */
export function useMaineSalesTrends(year: number) {
  const data = useQuery(api.maineData.getSalesTrends, { year });

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to get caregiver statistics
 */
export function useCaregiverStats() {
  const data = useQuery(api.maineData.getCaregiverStats);

  return {
    data,
    isLoading: data === undefined,
  };
}

/**
 * Hook to get expiring dispensaries
 */
export function useExpiringDispensaries(daysFromNow?: number) {
  const data = useQuery(api.maineData.getExpiringDispensaries, {
    daysFromNow,
  });

  return {
    data,
    isLoading: data === undefined,
  };
}
