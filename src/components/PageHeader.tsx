export function PageHeader({
  title,
  subtitle,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 md:mb-8">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
          {eyebrow}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  );
}
