export function PageHeader({
  title,
  subtitle,
  eyebrow,
  eyebrowVariant = "text",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  eyebrowVariant?: "text" | "chip";
}) {
  return (
    <div className="mb-6 md:mb-8">
      {eyebrow && (
        <p className={eyebrowVariant === "chip" ? "chip chip-primary mb-2 w-fit" : "text-xs font-semibold uppercase tracking-wider text-primary mb-2"}>
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  );
}
