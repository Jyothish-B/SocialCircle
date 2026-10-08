import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import PersonAvatar from "./PersonAvatar";
import RelationshipButton from "./RelationshipButton";

export default function PersonCard({ person }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/10">
      <Link to={`/people/${person.id}`} className="flex items-center gap-3 min-w-0 group">
        <PersonAvatar person={person} />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{person.name}</p>
          <p className="text-xs text-muted-foreground truncate">@{person.username}</p>
        </div>
      </Link>
      {person.bio && <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{person.bio}</p>}
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5" />
        {person.mutualCount > 0
          ? `${person.mutualCount} mutual friend${person.mutualCount > 1 ? "s" : ""}`
          : `${person.friendCount} friends`}
      </p>
      <RelationshipButton person={person} className="w-full mt-auto" />
    </div>
  );
}
