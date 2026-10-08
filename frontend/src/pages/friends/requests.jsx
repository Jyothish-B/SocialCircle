import { Link } from "react-router-dom";
import { Inbox, Loader2, Send } from "lucide-react";
import useAuth from "@/hooks/auth/use-auth";
import { useFriendRequests } from "@/hooks/data/friends/useFriendRequests";
import PersonAvatar from "@/components/people/PersonAvatar";
import RelationshipButton from "@/components/people/RelationshipButton";

const ago = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;
  return `${Math.floor(mins / 1440)} d ago`;
};

function RequestRow({ person, status }) {
  return (
    <li className="glass rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <Link to={`/people/${person.id}`} className="flex items-center gap-3 min-w-0 flex-1 group">
        <PersonAvatar person={person} />
        <div className="min-w-0">
          <p className="font-semibold truncate group-hover:text-primary transition-colors">{person.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            @{person.username}, {person.mutualCount} mutual, sent {ago(person.sentAt)}
          </p>
        </div>
      </Link>
      <RelationshipButton person={{ ...person, status }} className="sm:w-48" />
    </li>
  );
}

export default function Requests() {
  const { user } = useAuth();
  const { data, isLoading, error } = useFriendRequests(user?.id);

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (error) return <p className="text-destructive">Couldn&apos;t load requests: {error.message}</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Inbox className="h-5 w-5" /> Received{" "}
          <span className="text-muted-foreground font-normal">({data.incoming.length})</span>
        </h2>
        {data.incoming.length ? (
          <ul className="space-y-3">
            {data.incoming.map((p) => (
              <RequestRow key={p.id} person={p} status="incoming" />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No requests waiting for you.</p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-heading font-bold flex items-center gap-2">
          <Send className="h-5 w-5" /> Sent{" "}
          <span className="text-muted-foreground font-normal">({data.outgoing.length})</span>
        </h2>
        {data.outgoing.length ? (
          <ul className="space-y-3">
            {data.outgoing.map((p) => (
              <RequestRow key={p.id} person={p} status="requested" />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t sent any requests. Try the For You tab.
          </p>
        )}
      </section>
    </div>
  );
}
