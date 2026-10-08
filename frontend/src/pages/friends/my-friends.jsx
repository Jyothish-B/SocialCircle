import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllFriends } from "../../hooks/data/friends/useAllFriends";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/auth/use-auth";
import { UserX, Loader2, Search, HeartHandshake } from "lucide-react";
import { useRemoveFriend } from "@/hooks/data/friends/useRemoveFriend";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function getInitials(username) {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

const GRADIENT_PAIRS = [
  "from-violet-500 to-purple-700",
  "from-blue-500 to-cyan-600",
  "from-pink-500 to-rose-600",
  "from-orange-500 to-amber-600",
  "from-teal-500 to-emerald-600",
];

function FriendCard({ friend, onRemove, removingFriend }) {
  const isRemoving = removingFriend === friend.id;
  const gradient = GRADIENT_PAIRS[parseInt(friend.id, 16) % GRADIENT_PAIRS.length] || GRADIENT_PAIRS[0];
  return (
    <div className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-200 hover:shadow-2xl hover:shadow-primary/10">
      <div className={`h-16 bg-gradient-to-r ${gradient} opacity-60`} />
      <div className="px-5 pb-5 -mt-7">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg border-4 border-background`}>
          {getInitials(friend.username)}
        </div>
        <Link to={`/people/${friend.id}`} className="block mt-2 group">
          <p className="font-semibold truncate group-hover:text-primary transition-colors">{friend.name || `@${friend.username}`}</p>
          <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
        </Link>
        {friend.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[2rem]">{friend.bio}</p>}
        <Badge variant="secondary" className="text-xs mt-2 bg-green-500/10 text-green-600 dark:text-green-400 border-0">
          ✓ Connected
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4 border-destructive/30 text-destructive hover:bg-destructive/10"
          onClick={() => onRemove(friend)}
          disabled={isRemoving}
        >
          {isRemoving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserX className="h-4 w-4 mr-1" />}
          Remove Friend
        </Button>
      </div>
    </div>
  );
}

export default function MyFriends() {
  const { user } = useAuth();
  const { data: friends, isLoading, error } = useAllFriends(user.id);
  const removeFriendMutation = useRemoveFriend();
  const [removingFriend, setRemovingFriend] = useState(null);
  const [search, setSearch] = useState("");

  const handleRemoveFriend = async (friend) => {
    try {
      setRemovingFriend(friend.id);
      await removeFriendMutation.mutateAsync({ userId: user.id, friendId: friend.id });
    } catch (e) { console.error(e); }
    finally { setRemovingFriend(null); }
  };

  const term = search.toLowerCase();
  const filtered = friends?.filter(
    (f) => f.username.toLowerCase().includes(term) || f.name?.toLowerCase().includes(term)
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading friends...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <p>Error: {error.message}</p>
    </div>
  );

  if (!friends?.length) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <HeartHandshake className="h-16 w-16 opacity-20" />
      <p className="font-medium">No friends yet!</p>
      <p className="text-sm">Head over to <span className="text-primary font-medium">Discover</span> or <span className="text-primary font-medium">For You</span> to start connecting.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">My Friends</h2>
          <p className="text-muted-foreground text-sm">{friends?.length} connections</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search friends..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered?.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            onRemove={handleRemoveFriend}
            removingFriend={removingFriend}
          />
        ))}
      </div>
    </div>
  );
}
