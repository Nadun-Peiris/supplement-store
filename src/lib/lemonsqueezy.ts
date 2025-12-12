import crypto from "crypto";

/**
 * Lemon Squeezy uses a strict JSON:API schema. These helpers centralise the
 * shared attributes/relationships so that each route cannot accidentally send a
 * malformed payload (which was the root cause of the previous JSON:API errors).
 */
const API_BASE_URL = "https://api.lemonsqueezy.com/v1";

const API_KEY = getEnv("LEMON_SQUEEZY_API_KEY");
const STORE_ID = getEnv("LEMON_SQUEEZY_STORE_ID");
const WEBHOOK_SECRET = getEnv("LEMON_WEBHOOK_SECRET");
const SUBSCRIPTION_VARIANT_ID = process.env.LEMON_SUBSCRIPTION_VARIANT_ID;

/**
 * Generic authenticated fetch helper for Lemon Squeezy REST endpoints.
 * Maintains consistent headers and error handling for non-checkout calls.
 */
export async function lemonFetch<TResponse = unknown>(
  endpoint: string,
  init?: RequestInit
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data?.errors) {
      console.error(
        "Lemon Squeezy API error response:",
        JSON.stringify(data.errors, null, 2)
      );
    }

    const pointer = data?.errors?.[0]?.source?.pointer;
    const detail =
      (data && data.errors && data.errors[0]?.detail) ||
      data?.error ||
      `Lemon request failed with status ${response.status}`;
    throw new Error(pointer ? `${detail} (${pointer})` : detail);
  }

  return data as TResponse;
}

type JsonApiResourceIdentifier = {
  type: "stores" | "variants";
  id: string;
};

interface LemonCheckoutAttributes {
  checkout_data: {
    email: string;
    custom: Record<string, string>;
  };
  product_options?: {
    redirect_url?: string;
    enabled_variants?: string[];
  };
  checkout_options?: {
    embed?: boolean;
    media?: boolean;
    logo?: boolean;
    desc?: boolean;
    discount?: boolean;
    button_color?: string;
    subscription_preview?: boolean;
    skip_trial?: boolean;
  };
  custom_price?: number;
}

interface LemonCheckoutPayload {
  data: {
    type: "checkouts";
    attributes: LemonCheckoutAttributes;
    relationships: {
      store: { data: JsonApiResourceIdentifier };
      variant: { data: JsonApiResourceIdentifier };
    };
  };
}

interface LemonCheckoutResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      url?: string;
      checkout_url?: string;
      embed_url?: string;
    };
  };
}

interface BaseCheckoutParams {
  variantId: string;
  email: string;
  redirectUrl: string;
  customData: Record<string, string | number | boolean | null | undefined>;
  customPriceCents?: number;
  productOptions?: LemonCheckoutAttributes["product_options"];
  checkoutOptions?: LemonCheckoutAttributes["checkout_options"];
}

export interface OneTimeCheckoutParams {
  variantId: string;
  email: string;
  orderId: string;
  redirectUrl: string;
  /**
   * Lemon Squeezy expects custom_price to be sent in minor units (cents).
   * We compute this from the order total to avoid rounding bugs.
   */
  amountInMajorUnits: number;
}

export interface SubscriptionCheckoutParams {
  variantId?: string;
  email: string;
  orderId: string;
  userId: string;
  redirectUrl: string;
  amountInMajorUnits?: number;
}

function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable ${key}`);
  }
  return value;
}

function toMinorUnits(amount: number): number {
  if (Number.isNaN(amount)) {
    throw new Error("Amount must be a valid number");
  }

  // Lemon rejects non-integer custom_price values, so we normalise here.
  const cents = Math.round(amount * 100);
  if (cents <= 0) {
    throw new Error("custom_price must be greater than zero");
  }
  return cents;
}

function buildCustomMap(
  customData: BaseCheckoutParams["customData"]
): Record<string, string> {
  const sanitized: Record<string, string> = {};

  Object.entries(customData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    sanitized[key] = String(value);
  });

  return sanitized;
}

function buildCheckoutPayload({
  variantId,
  email,
  redirectUrl,
  customData,
  customPriceCents,
  productOptions,
  checkoutOptions,
}: BaseCheckoutParams): LemonCheckoutPayload {
  const attributes: LemonCheckoutAttributes = {
    checkout_data: {
      email,
      custom: buildCustomMap(customData),
    },
    product_options: {
      redirect_url: redirectUrl,
      ...(productOptions || {}),
    },
  };

  if (checkoutOptions) {
    attributes.checkout_options = checkoutOptions;
  }

  if (typeof customPriceCents === "number") {
    attributes.custom_price = customPriceCents;
  }

  return {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: {
          data: {
            type: "stores",
            id: STORE_ID,
          },
        },
        variant: {
          data: {
            type: "variants",
            id: variantId,
          },
        },
      },
    },
  };
}

async function lemonPost<TResponse>(
  endpoint: string,
  payload: unknown
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data?.errors) {
      console.error(
        "Lemon Squeezy API error response:",
        JSON.stringify(data.errors, null, 2)
      );
    }

    const pointer = data?.errors?.[0]?.source?.pointer;
    const detail =
      (data && data.errors && data.errors[0]?.detail) ||
      data?.error ||
      `Lemon request failed with status ${response.status}`;
    throw new Error(pointer ? `${detail} (${pointer})` : detail);
  }

  return data as TResponse;
}

export async function createOneTimeCheckout({
  variantId,
  email,
  orderId,
  redirectUrl,
  amountInMajorUnits,
}: OneTimeCheckoutParams): Promise<LemonCheckoutResponse> {
  const payload = buildCheckoutPayload({
    variantId,
    email,
    redirectUrl,
    customData: { orderId, type: "one_time" },
    customPriceCents: toMinorUnits(amountInMajorUnits),
  });

  return lemonPost<LemonCheckoutResponse>("/checkouts", payload);
}

export async function createSubscriptionCheckout({
  variantId,
  email,
  userId,
  orderId,
  redirectUrl,
  amountInMajorUnits,
}: SubscriptionCheckoutParams): Promise<LemonCheckoutResponse> {
  const resolvedVariantId = variantId ?? SUBSCRIPTION_VARIANT_ID;
  if (!resolvedVariantId) {
    throw new Error("LEMON_SUBSCRIPTION_VARIANT_ID is not configured");
  }

  const payload = buildCheckoutPayload({
    variantId: resolvedVariantId,
    email,
    redirectUrl,
    customData: { orderId, userId, type: "subscription" },
    customPriceCents:
      typeof amountInMajorUnits === "number"
        ? toMinorUnits(amountInMajorUnits)
        : undefined,
  });

  return lemonPost<LemonCheckoutResponse>("/checkouts", payload);
}

export function extractCheckoutUrl(response: LemonCheckoutResponse): string {
  return (
    response?.data?.attributes?.url ||
    response?.data?.attributes?.checkout_url ||
    response?.data?.attributes?.embed_url ||
    ""
  );
}

/**
 * Lemon signs the raw request body. Using Buffers + timingSafeEqual prevents
 * subtle encoding bugs and also defends against timing attacks.
 */
export function verifyLemonWebhookSignature(
  rawBody: Buffer,
  signatureHeader?: string | null
): boolean {
  if (!signatureHeader) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  const expected = Buffer.from(digest, "hex");
  const actual = Buffer.from(signatureHeader, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, actual);
}
