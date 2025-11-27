type InfoPageProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function InfoPage({
  title,
  description,
  children,
}: InfoPageProps) {
  return (
    <section className="info-page">
      <div className="info-card">
        <h1>{title}</h1>
        {description && <p className="info-lead">{description}</p>}
        {children}
      </div>
    </section>
  );
}
