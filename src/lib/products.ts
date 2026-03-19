import Product from "@/models/Product";
import { connectDB } from "./mongoose";
import { isValidObjectId, type FilterQuery, type SortOrder, Types } from "mongoose";
import type { ProductDTO } from "@/types/product";
import type { ProductDocument } from "@/models/Product";
import { normalizeSlug } from "./productFilters";
import { getProductSearchScore, normalizeSearchTerm } from "./productSearch";

type LeanProduct = ProductDocument & { _id: Types.ObjectId };
type ProductSortOption =
  | "default"
  | "price-asc"
  | "price-desc"
  | "name-asc"
  | "name-desc"
  | "newest";

export const normalizeProduct = (product: LeanProduct): ProductDTO => ({
  _id: product._id.toString(),
  name: product.name,
  slug: product.slug ?? product._id.toString(),
  category: product.category,
  categorySlug:
    product.categorySlug ??
    (product.category ? normalizeSlug(product.category) : undefined),
  brandName: product.brandName ?? "",
  brandSlug:
    product.brandSlug ??
    (product.brandName ? normalizeSlug(product.brandName) : undefined),
  price: product.price,
  discountPrice: product.discountPrice ?? undefined,
  currency: product.currency ?? "LKR",
  image: product.image,
  hoverImage: product.hoverImage ?? undefined,
  gallery: product.gallery?.filter(Boolean) ?? [],
  description: product.description ?? undefined,
  details: product.details
    ? {
        overview: product.details.overview ?? undefined,
        ingredients: product.details.ingredients?.filter(Boolean) ?? [],
        benefits: product.details.benefits?.filter(Boolean) ?? [],
        howToUse: product.details.howToUse?.filter(Boolean) ?? [],
        warnings: product.details.warnings?.filter(Boolean) ?? [],
        additionalInfo: product.details.additionalInfo?.filter(Boolean) ?? [],
        servingInfo: product.details.servingInfo
          ? {
              title: product.details.servingInfo.title ?? "Nutrition Facts",
              servingSize: product.details.servingInfo.servingSize ?? undefined,
              servingsPerContainer:
                product.details.servingInfo.servingsPerContainer ?? undefined,
              amountPerServingLabel:
                product.details.servingInfo.amountPerServingLabel ??
                "Amount Per Serving",
              dailyValueLabel:
                product.details.servingInfo.dailyValueLabel ?? "% Daily Value",
              footnote: product.details.servingInfo.footnote ?? undefined,
              ingredientsText:
                product.details.servingInfo.ingredientsText ?? undefined,
              containsText:
                product.details.servingInfo.containsText ?? undefined,
              noticeText: product.details.servingInfo.noticeText ?? undefined,
              nutrients:
                product.details.servingInfo.nutrients?.map((nutrient) => ({
                  name: nutrient.name ?? undefined,
                  amount: nutrient.amount ?? undefined,
                  dailyValue: nutrient.dailyValue ?? undefined,
                  indentLevel: nutrient.indentLevel ?? 0,
                  emphasized: nutrient.emphasized ?? false,
                })) ?? [],
            }
          : undefined,
      }
    : undefined,
  coa: product.coa
    ? {
        certificateUrl: product.coa.certificateUrl ?? undefined,
        verified: product.coa.verified ?? false,
      }
    : undefined,
  isActive: product.isActive ?? true,
  stock: typeof product.stock === "number" ? Math.max(product.stock, 0) : 0,
});

export const getProductBySlug = async (slug: string): Promise<ProductDTO | null> => {
  await connectDB();

  const query = isValidObjectId(slug) ? { _id: slug } : { slug };
  const product = await Product.findOne(query).lean<LeanProduct>();

  return product ? normalizeProduct(product) : null;
};

export const getProducts = async (
  query: FilterQuery<ProductDocument> = {},
  limit?: number
): Promise<ProductDTO[]> => {
  await connectDB();

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .limit(limit ?? 0)
    .lean<LeanProduct[]>();

  return products.map(normalizeProduct);
};

const getSortQuery = (
  sort: ProductSortOption
): Record<string, SortOrder | { $meta: unknown }> => {
  switch (sort) {
    case "price-asc":
      return { price: 1 as const };
    case "price-desc":
      return { price: -1 as const };
    case "name-asc":
      return { name: 1 as const };
    case "name-desc":
      return { name: -1 as const };
    case "newest":
    case "default":
    default:
      return { createdAt: -1 as const };
  }
};

const sortNormalizedProducts = (
  products: ProductDTO[],
  sort: ProductSortOption
) => {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      sorted.sort((left, right) => left.price - right.price);
      break;
    case "price-desc":
      sorted.sort((left, right) => right.price - left.price);
      break;
    case "name-asc":
      sorted.sort((left, right) => left.name.localeCompare(right.name));
      break;
    case "name-desc":
      sorted.sort((left, right) => right.name.localeCompare(left.name));
      break;
    case "newest":
    case "default":
    default:
      break;
  }

  return sorted;
};

export const getFilteredProducts = async (
  query: FilterQuery<ProductDocument> = {},
  {
    search,
    page = 1,
    limit = 9,
    sort = "default",
  }: {
    search?: string;
    page?: number;
    limit?: number;
    sort?: ProductSortOption;
  } = {}
) => {
  await connectDB();

  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 60);
  const normalizedSearch = normalizeSearchTerm(search);

  if (!normalizedSearch) {
    const [totalProducts, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort(getSortQuery(sort))
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean<LeanProduct[]>(),
    ]);

    const totalPages = totalProducts ? Math.ceil(totalProducts / safeLimit) : 0;

    return {
      products: products.map(normalizeProduct),
      totalProducts,
      totalPages,
      currentPage: totalProducts ? Math.min(safePage, totalPages || 1) : 1,
    };
  }

  const candidates = await Product.find(query)
    .sort({ createdAt: -1 })
    .lean<LeanProduct[]>();

  const ranked = candidates
    .map((product) => ({
      product: normalizeProduct(product),
      score: getProductSearchScore(product, normalizedSearch),
    }))
    .filter((entry) => entry.score > 0);

  const sorted = [...ranked].sort((left, right) => right.score - left.score);
  const normalizedProducts = sort === "default"
    ? sorted.map((entry) => entry.product)
    : sortNormalizedProducts(
        sorted.map((entry) => entry.product),
        sort
      );

  const totalProducts = normalizedProducts.length;
  const totalPages = totalProducts ? Math.ceil(totalProducts / safeLimit) : 0;
  const start = (safePage - 1) * safeLimit;
  const pagedProducts = normalizedProducts.slice(start, start + safeLimit);

  return {
    products: pagedProducts,
    totalProducts,
    totalPages,
    currentPage: totalProducts ? Math.min(safePage, totalPages || 1) : 1,
  };
};
