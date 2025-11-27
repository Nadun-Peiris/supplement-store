import slugify from "slugify";
import type { FilterQuery } from "mongoose";
import type { ProductDocument } from "@/models/Product";

const slugOptions = { lower: true, strict: true, trim: true };

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const slugToRegex = (slug: string) => {
  const segments = slug.split("-").map(escapeRegex);
  const pattern = segments.join("[\\s-]*");
  return new RegExp(`^${pattern}$`, "i");
};

export const normalizeSlug = (value: string) =>
  slugify(value, slugOptions);

export const parseListParam = (value: string | null): string[] =>
  value
    ? value
        .split(",")
        .map((segment) => segment.trim())
        .filter(Boolean)
    : [];

export const buildCategoryFilter = (
  values: string[]
): FilterQuery<ProductDocument> | undefined => {
  const slugs = Array.from(
    new Set(values.map((value) => normalizeSlug(value)))
  ).filter(Boolean);

  if (!slugs.length) return undefined;

  const regexClauses = slugs.map((slug) => ({ category: slugToRegex(slug) }));

  return {
    $or: [{ categorySlug: { $in: slugs } }, ...regexClauses],
  };
};

export const buildBrandFilter = (
  values: string[]
): FilterQuery<ProductDocument> | undefined => {
  const slugs = Array.from(
    new Set(values.map((value) => normalizeSlug(value)))
  ).filter(Boolean);

  if (!slugs.length) return undefined;

  const regexClauses = slugs.map((slug) => ({ brandName: slugToRegex(slug) }));

  return {
    $or: [{ brandSlug: { $in: slugs } }, ...regexClauses],
  };
};

export const buildPriceFilter = (
  min?: number,
  max?: number
): FilterQuery<ProductDocument> | undefined => {
  const price: { $gte?: number; $lte?: number } = {};

  if (typeof min === "number" && Number.isFinite(min)) {
    price.$gte = Math.max(0, min);
  }

  if (typeof max === "number" && Number.isFinite(max)) {
    price.$lte = Math.max(0, max);
  }

  const hasMin = typeof price.$gte === "number";
  const hasMax = typeof price.$lte === "number";

  if (!hasMin && !hasMax) return undefined;

  if (hasMin && hasMax && (price.$lte as number) < (price.$gte as number)) {
    const [low, high] = [price.$lte as number, price.$gte as number].sort(
      (a, b) => a - b
    );
    price.$gte = low;
    price.$lte = high;
  }

  return { price };
};

export const combineFilters = (
  ...filters: Array<FilterQuery<ProductDocument> | undefined>
): FilterQuery<ProductDocument> => {
  const normalized = filters.filter(
    (filter): filter is FilterQuery<ProductDocument> => Boolean(filter)
  );

  if (!normalized.length) return {};
  if (normalized.length === 1) return normalized[0];

  return { $and: normalized };
};

export const parseNumberParam = (value: string | null) => {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};
