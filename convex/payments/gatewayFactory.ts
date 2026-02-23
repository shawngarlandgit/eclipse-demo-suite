/**
 * Payment Gateway Factory
 *
 * Returns the appropriate gateway implementation based on POS provider.
 * This pattern allows adding new POS systems without schema changes.
 *
 * To add a new POS:
 * 1. Create a new gateway file in gateways/ implementing IPaymentGateway
 * 2. Add the import and case to getPaymentGateway()
 * 3. No schema changes required!
 */

import { IPaymentGateway } from "./gateway";
import { FlowhubGateway } from "./gateways/flowhub";

// =============================================================================
// Gateway Registry
// =============================================================================

/**
 * Supported POS providers
 */
export const SUPPORTED_POS_PROVIDERS = [
  "flowhub",
  // Future: "budtrack", "dutchie", "treez", "blaze"
] as const;

export type SupportedPosProvider = (typeof SUPPORTED_POS_PROVIDERS)[number];

/**
 * Check if a provider is supported
 */
export function isSupportedProvider(
  provider: string
): provider is SupportedPosProvider {
  return SUPPORTED_POS_PROVIDERS.includes(provider as SupportedPosProvider);
}

// =============================================================================
// Gateway Factory
// =============================================================================

/**
 * Gateway instance cache for reuse
 */
const gatewayCache = new Map<string, IPaymentGateway>();

/**
 * Get the payment gateway for a given POS provider
 *
 * @param posProvider - The POS provider name (e.g., "flowhub", "budtrack")
 * @returns The gateway instance for the provider
 * @throws Error if provider is not supported
 *
 * @example
 * const gateway = getPaymentGateway("flowhub");
 * const result = await gateway.syncPayment(payment, order, config);
 */
export function getPaymentGateway(posProvider: string): IPaymentGateway {
  // Check cache first
  const cached = gatewayCache.get(posProvider);
  if (cached) {
    return cached;
  }

  let gateway: IPaymentGateway;

  switch (posProvider.toLowerCase()) {
    case "flowhub":
      gateway = new FlowhubGateway();
      break;

    // =========================================================================
    // Future POS Gateways (add new cases here)
    // =========================================================================

    // case "budtrack":
    //   gateway = new BudtrackGateway();
    //   break;

    // case "dutchie":
    //   gateway = new DutchieGateway();
    //   break;

    // case "treez":
    //   gateway = new TreezGateway();
    //   break;

    // case "blaze":
    //   gateway = new BlazeGateway();
    //   break;

    default:
      throw new Error(
        `Unsupported POS provider: ${posProvider}. ` +
          `Supported providers: ${SUPPORTED_POS_PROVIDERS.join(", ")}`
      );
  }

  // Cache the instance
  gatewayCache.set(posProvider, gateway);

  return gateway;
}

/**
 * Clear the gateway cache (useful for testing)
 */
export function clearGatewayCache(): void {
  gatewayCache.clear();
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a list of all supported POS providers with display names
 */
export function getSupportedProviders(): Array<{
  id: string;
  name: string;
  description: string;
}> {
  return [
    {
      id: "flowhub",
      name: "Flowhub",
      description: "Cannabis retail POS with compliance tracking",
    },
    // Future providers:
    // {
    //   id: "budtrack",
    //   name: "BudTrack",
    //   description: "Cannabis inventory and POS solution",
    // },
    // {
    //   id: "dutchie",
    //   name: "Dutchie POS",
    //   description: "E-commerce and POS for cannabis",
    // },
  ];
}

/**
 * Validate that a provider is supported and return a normalized ID
 *
 * @param provider - The provider string to validate
 * @returns Normalized provider ID or null if not supported
 */
export function normalizeProvider(provider: string): string | null {
  const normalized = provider.toLowerCase().trim();

  if (isSupportedProvider(normalized)) {
    return normalized;
  }

  // Handle common aliases
  const aliases: Record<string, string> = {
    fh: "flowhub",
    "flow-hub": "flowhub",
    // bt: "budtrack",
    // "bud-track": "budtrack",
  };

  return aliases[normalized] || null;
}
