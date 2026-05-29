import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { getProfileByUsername, getCircles, getJoinedCircleIds, getCircleHandle } from "@/data/backend";
import { MapPin } from "lucide-react";
import { tagClass } from "@/lib/tag-class";
import { SocialLinks } from "@/components/SocialLinks";
import { NATIONALITIES } from "@/data/profile-options";
import { filterValidTags, tagLabel } from "@/data/tags";

export const Route = createFileRoute("/users_/$username")({
  loader: async ({ params }) => {
    const profile = await getProfileByUsername(params.username);
    if (!profile) throw notFound();
    const [allCircles, joinedIds] = await Promise.all([
      getCircles(),
      getJoinedCircleIds(profile.id),
    ]);
    const joinedSet = new Set(joinedIds);
    const circles = allCircles.filter((c) => joinedSet.has(c.id));
    return { profile, circles };
  },
  notFoundComponent: () => (
    <div className="text-center py-16">
      <h1 className="text-2xl font-bold">User not found</h1>
      <Link to="/" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        Back to home
      </Link>
    </div>
  ),
  component: UserProfilePage,
});

function UserProfilePage() {
  const { profile, circles } = Route.useLoaderData();
  const { i18n } = useTranslation();
  const router = useRouter();

  const initials = (profile.displayName || profile.username || "?")[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header card */}
      <section className="card-base p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-20 h-20 rounded-2xl object-cover border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary border border-border">
                {initials}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-tight">{profile.displayName || profile.username}</h1>
            {profile.username && (
              <p className="text-sm text-muted-foreground mt-0.5">@{profile.username}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-muted-foreground">
              {profile.university && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.university}
                </span>
              )}
              {profile.year && <span>{profile.year}</span>}
              {profile.nationality && (() => {
                const nat = NATIONALITIES.find((n) => n.name === profile.nationality);
                return <span>{nat?.flag} {profile.nationality}</span>;
              })()}
              {profile.careerField && <span>· {profile.careerField}</span>}
            </div>

            {profile.bio && (
              <p className="mt-3 text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* Social links */}
        {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
          <div className="mt-4 pt-4 border-t border-border">
            <SocialLinks links={profile.socialLinks} />
          </div>
        )}

        {/* Interests */}
        {filterValidTags(profile.interests ?? []).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-1.5">
            {filterValidTags(profile.interests ?? []).map((tag) => (
              <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagClass(tag)}`}>{tagLabel(tag, i18n.language)}</span>
            ))}
          </div>
        )}
      </section>

      {/* Circles */}
      {circles.length > 0 && (
        <section className="card-base p-6 space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Circles</h2>
          <div className="space-y-2">
            {circles.map((c) => (
              <Link
                key={c.id}
                to="/circles/$circleHandle"
                params={{ circleHandle: getCircleHandle(c) }}
                className="flex items-center gap-3 rounded-lg p-2 -mx-2 hover:bg-muted transition-colors"
              >
                <div className="w-9 h-9 flex items-center justify-center shrink-0">
                  {(c as any).iconUrl ? (
                    <img src={(c as any).iconUrl} alt={c.name} className="w-9 h-9 rounded-lg object-cover" />
                  ) : (
                    <span className="text-2xl leading-none">{c.emoji}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm leading-tight truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.category}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <button
        onClick={() => router.history.back()}
        className="inline-block text-sm font-semibold text-primary hover:underline"
      >
        ← Back
      </button>
    </div>
  );
}
