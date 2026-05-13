import { redirect } from "next/navigation";
import { getShopCategoryHref } from "@/lib/shopRoutes";

type ShopCategoryPageProps = {
  params: Promise<{ category: string }>;
};

export default async function LegacyShopCategoryPage({
  params,
}: ShopCategoryPageProps) {
  const { category } = await params;
  redirect(getShopCategoryHref(decodeURIComponent(category)));
}
