import { Link, createFileRoute } from "@tanstack/react-router";
import { DeleteRecordButton } from "@/components/DeleteRecordButton";
import { PageHeader } from "@/components/PageHeader";
import { SocialLinks } from "@/components/SocialLinks";
import { deleteEvent, getEventByHandle } from "@/data/backend";

export const Route = createFileRoute("/events_/$eventHandle")({
  loader: ({ params }) => getEventByHandle(params.eventHandle),
  component: EventDetailPage,
});

function EventDetailPage() {
  const event = Route.useLoaderData();

  if (!event) {
    return <NotFound name="event" to="/events" />;
  }

  return (
    <div>
      <PageHeader eyebrow="Events" title={event.title} subtitle={`${event.date} · ${event.location}`} />

      <section className="card-base p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Detail label="Category" value={event.category} />
          <Detail label="Going" value={`${event.going}`} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map((tag) => (
            <span key={tag} className="chip">
              {tag}
            </span>
          ))}
        </div>
        <SocialLinks links={event.socialLinks} />
        <DeleteRecordButton label={event.title} onDelete={() => deleteEvent(event.id)} />
        <Link to="/events" className="text-sm font-semibold text-primary hover:underline">
          Back to events
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
