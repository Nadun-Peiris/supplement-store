import InfoPage from "@/components/InfoPage";
import Link from "next/link";

export default function CategoriesPage() {
  return (
    <InfoPage
      title="Shop by Category"
      description="Browse every category from a single place."
    >
      <p>
        Use the <Link href="/shop">shop page</Link> filters to explore protein,
        pre-workout, creatine, recovery, and more. A dedicated landing page is
        in progress.
      </p>
    </InfoPage>
  );
}
