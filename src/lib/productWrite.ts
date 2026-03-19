import type { ProductDTO, ProductDetailsDTO, ProductNutrientDTO, ProductServingInfoDTO } from "@/types/product";
import { normalizeSlug } from "./productFilters";
import { defaultNutritionFacts, nutritionFactsDefaults } from "./productNutrition";

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized ? normalized : undefined;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const normalizeInteger = (value: unknown) => {
  const parsed = normalizeNumber(value);
  if (typeof parsed !== "number") return undefined;
  return Math.trunc(parsed);
};

const normalizeBoolean = (value: unknown, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
};

const hasText = (value: string | undefined) => Boolean(value && value.trim().length);

const normalizeNutrient = (value: unknown): ProductNutrientDTO | null => {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const name = normalizeOptionalString(row.name);
  const amount = normalizeOptionalString(row.amount);
  const dailyValue = normalizeOptionalString(row.dailyValue);
  const indentLevel = normalizeInteger(row.indentLevel);
  const emphasized = normalizeBoolean(row.emphasized);

  if (!name && !amount && !dailyValue) return null;

  return {
    name,
    amount,
    dailyValue,
    indentLevel: typeof indentLevel === "number" ? Math.max(indentLevel, 0) : 0,
    emphasized,
  };
};

const shouldKeepServingInfo = (
  servingInfo: ProductServingInfoDTO,
  rawServingInfo?: Record<string, unknown>
) => {
  const rows = servingInfo.nutrients?.length ?? 0;
  const rawTitle = normalizeOptionalString(rawServingInfo?.title);
  const rawAmountLabel = normalizeOptionalString(rawServingInfo?.amountPerServingLabel);
  const rawDailyValueLabel = normalizeOptionalString(rawServingInfo?.dailyValueLabel);

  return Boolean(
    rows ||
      hasText(servingInfo.servingSize) ||
      typeof servingInfo.servingsPerContainer === "number" ||
      hasText(servingInfo.footnote) ||
      hasText(servingInfo.ingredientsText) ||
      hasText(servingInfo.containsText) ||
      hasText(servingInfo.noticeText) ||
      rawTitle ||
      rawAmountLabel ||
      rawDailyValueLabel
  );
};

export const normalizeServingInfoInput = (value: unknown): ProductServingInfoDTO | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const row = value as Record<string, unknown>;
  const defaults = defaultNutritionFacts();
  const nutrients = Array.isArray(row.nutrients)
    ? row.nutrients
        .map(normalizeNutrient)
        .filter((entry): entry is ProductNutrientDTO => Boolean(entry))
    : [];

  const servingInfo: ProductServingInfoDTO = {
    title:
      normalizeOptionalString(row.title) ??
      nutritionFactsDefaults.DEFAULT_NUTRITION_TITLE,
    servingSize: normalizeOptionalString(row.servingSize),
    servingsPerContainer: normalizeInteger(row.servingsPerContainer),
    amountPerServingLabel:
      normalizeOptionalString(row.amountPerServingLabel) ??
      defaults.amountPerServingLabel,
    dailyValueLabel:
      normalizeOptionalString(row.dailyValueLabel) ??
      defaults.dailyValueLabel,
    footnote: normalizeOptionalString(row.footnote),
    ingredientsText: normalizeOptionalString(row.ingredientsText),
    containsText: normalizeOptionalString(row.containsText),
    noticeText: normalizeOptionalString(row.noticeText),
    nutrients,
  };

  return shouldKeepServingInfo(servingInfo, row) ? servingInfo : undefined;
};

export const normalizeDetailsInput = (value: unknown): ProductDetailsDTO | undefined => {
  if (!value || typeof value !== "object") return undefined;

  const row = value as Record<string, unknown>;
  const details: ProductDetailsDTO = {
    overview: normalizeOptionalString(row.overview),
    ingredients: normalizeStringArray(row.ingredients),
    benefits: normalizeStringArray(row.benefits),
    howToUse: normalizeStringArray(row.howToUse),
    warnings: normalizeStringArray(row.warnings),
    additionalInfo: normalizeStringArray(row.additionalInfo),
    servingInfo: normalizeServingInfoInput(row.servingInfo),
  };

  const hasDetails = Boolean(
    hasText(details.overview) ||
      details.ingredients?.length ||
      details.benefits?.length ||
      details.howToUse?.length ||
      details.warnings?.length ||
      details.additionalInfo?.length ||
      details.servingInfo
  );

  return hasDetails ? details : undefined;
};

type NormalizedProductWritePayload = {
  name?: string;
  slug?: string;
  category?: string;
  categorySlug?: string;
  brandName?: string;
  brandSlug?: string;
  price?: number;
  discountPrice?: number;
  currency?: string;
  image?: string;
  hoverImage?: string;
  gallery: string[];
  description?: string;
  details?: ProductDetailsDTO;
  coa: {
    certificateUrl?: string;
    verified: boolean;
  };
  isActive: boolean;
  stock: number;
};

export const normalizeProductWritePayload = (
  raw: unknown,
  existing?: ProductDTO | null
): NormalizedProductWritePayload => {
  const value = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const hasKey = (key: string) => Object.prototype.hasOwnProperty.call(value, key);

  const name = hasKey("name")
    ? normalizeOptionalString(value.name)
    : existing?.name;
  const category = hasKey("category")
    ? normalizeOptionalString(value.category)
    : existing?.category;
  const brandName = hasKey("brandName")
    ? normalizeOptionalString(value.brandName) ?? ""
    : existing?.brandName ?? "";

  const price = hasKey("price")
    ? normalizeNumber(value.price)
    : existing?.price;
  const discountPrice = hasKey("discountPrice")
    ? normalizeNumber(value.discountPrice)
    : existing?.discountPrice ?? undefined;
  const stock = Math.max(
    0,
    hasKey("stock")
      ? normalizeInteger(value.stock) ?? 0
      : existing?.stock ?? 0
  );

  const slugSource = hasKey("slug")
    ? normalizeOptionalString(value.slug) ?? name
    : name;
  const categorySlugSource =
    hasKey("categorySlug")
      ? normalizeOptionalString(value.categorySlug) ?? category
      : category;
  const brandSlugSource =
    hasKey("brandSlug")
      ? normalizeOptionalString(value.brandSlug) ?? brandName
      : brandName;

  return {
    name,
    slug: slugSource ? normalizeSlug(slugSource) : existing?.slug,
    category,
    categorySlug: categorySlugSource
      ? normalizeSlug(categorySlugSource)
      : existing?.categorySlug,
    brandName,
    brandSlug: brandSlugSource ? normalizeSlug(brandSlugSource) : undefined,
    price,
    discountPrice,
    currency: hasKey("currency")
      ? normalizeOptionalString(value.currency) ?? "LKR"
      : existing?.currency ?? "LKR",
    image: hasKey("image")
      ? normalizeOptionalString(value.image)
      : existing?.image,
    hoverImage: hasKey("hoverImage")
      ? normalizeOptionalString(value.hoverImage)
      : existing?.hoverImage,
    gallery: hasKey("gallery")
      ? normalizeStringArray(value.gallery)
      : existing?.gallery ?? [],
    description: hasKey("description")
      ? normalizeOptionalString(value.description)
      : existing?.description,
    details: hasKey("details")
      ? normalizeDetailsInput(value.details)
      : existing?.details ?? undefined,
    coa: {
      certificateUrl: hasKey("coa")
        ? normalizeOptionalString(
            (value.coa as Record<string, unknown> | undefined)?.certificateUrl
          )
        : existing?.coa?.certificateUrl,
      verified: normalizeBoolean(
        hasKey("coa")
          ? (value.coa as Record<string, unknown> | undefined)?.verified
          : existing?.coa?.verified,
        existing?.coa?.verified ?? false
      ),
    },
    isActive: hasKey("isActive")
      ? normalizeBoolean(value.isActive, existing?.isActive ?? true)
      : existing?.isActive ?? true,
    stock,
  };
};
