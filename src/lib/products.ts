import Product from "@/models/Product";
import { connectDB } from "./mongoose";
import { isValidObjectId, type FilterQuery, Types } from "mongoose";
import type { ProductDTO } from "@/types/product";
import type { ProductDocument } from "@/models/Product";
import { normalizeSlug } from "./productFilters";

type LeanProduct = ProductDocument & { _id: Types.ObjectId };

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
  image: product.image,
  hoverImage: product.hoverImage ?? undefined,
  description: product.description ?? undefined,
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
