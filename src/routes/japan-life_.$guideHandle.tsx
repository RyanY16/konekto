import { Link, createFileRoute } from "@tanstack/react-router";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { deleteGuide, getGuideByHandle } from "@/data/backend";

export const Route = createFileRoute("/japan-life_/$guideHandle")({
  loader: ({ params }) => getGuideByHandle(params.guideHandle),
  component: GuideDetailPage,
});

function GuideDetailPage() {
  const guide = Route.useLoaderData();

  if (!guide) {
    return <NotFound name="guide" to="/japan-life" />;
  }

  return (
    <div>
      <PageHeader eyebrow="Japan Life" title={guide.title} subtitle={`${guide.section} · ${guide.readTime}`} />

      <section className="card-base p-6 space-y-4">
        <p className="text-sm text-muted-foreground">{guide.excerpt}</p>
        <SocialLinks links={guide.socialLinks} />
        <DeleteRecordButton label={guide.title} onDelete={() => deleteGuide(guide.id)} />
        <Link to="/japan-life" className="text-sm font-semibold text-primary hover:underline">
          Back to Japan Life
        </Link>
      </section>
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
