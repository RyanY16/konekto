import { Link, createFileRoute } from "@tanstack/react-router";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { deleteJob, getJobByHandle } from "@/data/backend";

export const Route = createFileRoute("/careers_/$jobHandle")({
  loader: ({ params }) => getJobByHandle(params.jobHandle),
  component: JobDetailPage,
});

function JobDetailPage() {
  const job = Route.useLoaderData();

  if (!job) {
    return <NotFound name="role" to="/careers" />;
  }

  return (
    <div>
      <PageHeader eyebrow="Careers" title={job.role} subtitle={`${job.company} · ${job.location}`} />

      <section className="card-base p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Detail label="Type" value={job.type} />
          <Detail label="Location" value={job.location} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
        <SocialLinks links={job.socialLinks} />
        <DeleteRecordButton label={job.role} onDelete={() => deleteJob(job.id)} />
        <Link to="/careers" className="text-sm font-semibold text-primary hover:underline">
          Back to careers
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
