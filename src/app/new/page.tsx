import InfoPage from "@/components/InfoPage";
import Link from "next/link";

export default function NewArrivalsPage() {
  return (
    <InfoPage
      title="New Arrivals"
      description="Fresh drops land weekly. This page will showcase the newest inventory."
    >
      <p>
        For now, head over to the <Link href="/shop">shop</Link> and sort by
        newest to see the latest products.
      </p>
    </InfoPage>
  );
}
