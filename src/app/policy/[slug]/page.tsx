import InfoPage from "@/components/InfoPage";
import type { Metadata } from "next";

const policyCopy: Record<
  string,
  { title: string; description: string }
> = {
  privacy: {
    title: "Privacy Policy",
    description:
      "We are preparing a detailed privacy policy outlining how your personal data is collected, stored, and protected.",
  },
  terms: {
    title: "Terms & Conditions",
    description:
      "These terms will cover order processing, delivery timelines, and your rights as a valued customer.",
  },
  returns: {
    title: "Return & Refund Policy",
    description:
      "We're finalizing a customer-friendly returns process. If you have an issue with an order, please contact us.",
  },
  shipping: {
    title: "Shipping Information",
    description:
      "Nationwide delivery options, courier partners, and delivery timeframes will be documented soon.",
  },
};

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  props: PolicyPageProps
): Promise<Metadata> {
  const { slug } = await props.params;
  const copy = policyCopy[slug] ?? {
    title: "Policy",
    description: "Details coming soon.",
  };
  return {
    title: `${copy.title} | Supplement Store`,
    description: copy.description,
  };
}

export default async function PolicyPage(props: PolicyPageProps) {
  const { slug } = await props.params;
  const copy =
    policyCopy[slug] ?? policyCopy.terms ?? {
      title: "Policy",
      description: "Details coming soon.",
    };

  return (
    <InfoPage title={copy.title} description={copy.description}>
      <p>
        Need assistance right now? Reach us on{" "}
        <a href="tel:+94777658483">+94 77 765 8483</a> or email{" "}
        <a href="mailto:info@supplement.com">info@supplement.com</a>.
      </p>
    </InfoPage>
  );
}
