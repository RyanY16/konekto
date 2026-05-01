import { Link, createFileRoute } from "@tanstack/react-router";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { deleteDeal, getDealByHandle } from "@/data/backend";

export const Route = createFileRoute("/deals_/$dealHandle")({
  loader: ({ params }) => getDealByHandle(params.dealHandle),
  component: DealDetailPage,
});

function DealDetailPage() {
  const deal = Route.useLoaderData();

  if (!deal) {
    return <NotFound name="deal" to="/deals" />;
  }

  return (
    <div>
      <PageHeader eyebrow="Deals" title={deal.title} subtitle={`${deal.brand} · ${deal.area}`} />

      <section className="card-base p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Detail label="Category" value={deal.category} />
          <Detail label="Discount" value={deal.discount} />
        </div>
        <SocialLinks links={deal.socialLinks} />
        <DeleteRecordButton label={deal.title} onDelete={() => deleteDeal(deal.id)} />
        <Link to="/deals" className="text-sm font-semibold text-primary hover:underline">
          Back to deals
        </Link>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function NotFound({ name, to }: { name: string; to: string }) {
  return (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold">{name} not found</h1>
      <Link to={to} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Go back
      </Link>
    </div>
  );
}
