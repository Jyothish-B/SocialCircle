import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/hooks/auth/use-auth";
import { usePerson } from "@/hooks/data/people/usePerson";
import PersonAvatar from "@/components/people/PersonAvatar";
import RelationshipButton from "@/components/people/RelationshipButton";

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "unknown";

const sinceText = (iso) => {
  if (!iso) return "unknown";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

function Section({ title, count, children }) {
  return (
    <section className="glass rounded-2xl p-5 space-y-4">
      <h2 className="font-heading font-semibold text-lg">
        {title}{" "}
        {count != null && <span className="text-muted-foreground font-normal text-sm">({count})</span>}
      </h2>
      {children}
    </section>
  );
}

function PeopleList({ people, empty }) {
  if (!people.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {people.map((p) => (
        <li key={p.id}>
          <Link
            to={`/people/${p.id}`}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-primary/5 transition-colors"
          >
            <PersonAvatar person={p} size="sm" />
            <span className="min-w-0">
              <span className="block text-sm font-medium truncate">{p.name}</span>
              <span className="block text-xs text-muted-foreground truncate">@{p.username}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function Person() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: person, isLoading, error } = usePerson(id, user?.id);

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive">{error.response?.data?.error || error.message}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    );

  const isSelf = person.status === "self";
  const sharedInterests = person.interests.filter((i) => i.shared).length;
  const stats = [
    ["Friends", person.friendCount],
    ["Mutual", isSelf ? "-" : person.mutualCount],
    ["Followers", person.followerCount],
    ["Following", person.followingCount],
  ];

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <header className="glass rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
        <PersonAvatar person={person} size="lg" />
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h1 className="text-3xl font-heading font-bold truncate">{person.name}</h1>
            <p className="text-muted-foreground">
              @{person.username}
              {isSelf && " (you)"}
            </p>
          </div>
          {person.bio && <p className="max-w-prose">{person.bio}</p>}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> Joined {formatDate(person.joinedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> Active {sinceText(person.lastActiveAt)}
            </span>
          </div>
        </div>
        <RelationshipButton person={person} size="default" className="md:w-44" />
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(([label, value]) => (
          <div key={label} className="glass rounded-2xl p-4">
            <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
            <dd className="text-2xl font-heading font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Interests" count={person.interests.length}>
          {sharedInterests > 0 && !isSelf && (
            <p className="text-sm text-muted-foreground">You share {sharedInterests}, highlighted below.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {person.interests.map((i) => (
              <Badge
                key={i.name}
                variant={i.shared && !isSelf ? "default" : "secondary"}
                title={i.category ? `${i.category}, weight ${i.weight}` : undefined}
              >
                {i.name}
              </Badge>
            ))}
          </div>
        </Section>

        <Section title="Groups" count={person.groups.length}>
          <ul className="space-y-2">
            {person.groups.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  {g.name}
                  {g.role === "admin" && <span className="text-muted-foreground"> (admin)</span>}
                </span>
                <span className="text-muted-foreground shrink-0 tabular-nums">
                  {g.shared && !isSelf && <Badge className="mr-2">You&apos;re in it</Badge>}
                  {g.members} members
                </span>
              </li>
            ))}
            {!person.groups.length && <li className="text-sm text-muted-foreground">Not in any groups yet.</li>}
          </ul>
        </Section>

        {!isSelf && (
          <Section title="Mutual friends" count={person.mutualCount}>
            <PeopleList people={person.mutualFriends} empty="No friends in common yet." />
          </Section>
        )}

        <Section title="Closest friends">
          <PeopleList people={person.closeFriends} empty="No friends yet." />
        </Section>
      </div>
    </div>
  );
}
