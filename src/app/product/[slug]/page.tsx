import SingleProductPage from "./SingleProductPage";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import type { ProductDTO } from "@/types/product";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  const product: ProductDTO | null = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return <SingleProductPage product={product} />;
}
