import InfoPage from "@/components/InfoPage";

export default function ContactPage() {
  return (
    <InfoPage
      title="Contact Us"
      description="We’re ready to help with product recommendations, stock inquiries, and delivery updates."
    >
      <p>
        Phone: <a href="tel:+94777658483">+94 77 765 8483</a>
        <br />
        Email: <a href="mailto:info@supplement.com">info@supplement.com</a>
      </p>
    </InfoPage>
  );
}
