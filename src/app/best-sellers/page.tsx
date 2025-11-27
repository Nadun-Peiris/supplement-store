import InfoPage from "@/components/InfoPage";
import Link from "next/link";

export default function BestSellersPage() {
  return (
    <InfoPage
      title="Best Sellers"
      description="Our community favorites will live here soon."
    >
      <p>
        Until then, check the curated picks on the{" "}
        <Link href="/shop">shop page</Link> and sort by popularity or price.
      </p>
    </InfoPage>
  );
}
