import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { useRecommendFriends } from "@/hooks/data/friends/useRecommendFriends";
import useAuth from "@/hooks/auth/use-auth";
import { Badge } from "@/components/ui/badge";
import PersonAvatar from "@/components/people/PersonAvatar";
import RelationshipButton from "@/components/people/RelationshipButton";

function RecommendationCard({ friend, status, onStatusChange }) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 border border-primary/10 hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-200 hover:shadow-2xl hover:shadow-primary/10">
      <div className="flex items-center gap-3">
        <Link to={`/people/${friend.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
          <PersonAvatar person={friend} />
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
              {friend.name || `@${friend.username}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
          </div>
        </Link>
        <p className="text-lg font-bold text-primary tabular-nums" title="Match score">
          {Math.round(friend.matchScore)}%
        </p>
      </div>

      <Badge className="self-start text-xs bg-amber-400/10 text-amber-600 dark:text-amber-400 border-amber-400/20 border">
        <Zap className="h-2.5 w-2.5 mr-1" /> {friend.reason}
      </Badge>

      {friend.commonFriendsCount > 0 && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          {friend.commonFriendsCount} mutual friend{friend.commonFriendsCount > 1 ? "s" : ""}
          {friend.mutualFriends?.length > 0 && `, including ${friend.mutualFriends.join(", ")}`}
        </p>
      )}

      {friend.sharedInterests?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {friend.sharedInterests.map((interest) => (
            <Badge key={interest} variant="secondary" className="text-xs">
              {interest}
            </Badge>
          ))}
        </div>
      )}

      <RelationshipButton
        person={{ ...friend, status }}
        className="w-full mt-auto"
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

export default function SuggestedFriends() {
  const { user } = useAuth();
  const { data: suggestedFriends, isLoading, error } = useRecommendFriends(user?.id);
  // Cards stay in place after "Add friend" so the new state is visible;
  // the next refresh drops them from the list
  const [statuses, setStatuses] = useState({});

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Finding people you might know...</p>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        <p>Error: {error.message}</p>
      </div>
    );

  if (!suggestedFriends?.length)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
        <Sparkles className="h-16 w-16 opacity-20" />
        <p className="font-medium">No suggestions right now</p>
        <p className="text-sm">Add interests or join groups to get better recommendations.</p>
      </div>
    );

  const coldStart = suggestedFriends[0]?.strategy === "cold-start";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-400" />
          Recommended Friends
        </h2>
        <p className="text-muted-foreground text-sm">
          {coldStart
            ? "You're new here, so these are based on your interests, groups and activity"
            : "Ranked by mutual friends, shared interests, community and recent activity"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {suggestedFriends.map((friend) => (
          <RecommendationCard
            key={friend.id}
            friend={friend}
            status={statuses[friend.id] ?? "none"}
            onStatusChange={(status) => setStatuses((s) => ({ ...s, [friend.id]: status }))}
          />
        ))}
      </div>
    </div>
  );
}
