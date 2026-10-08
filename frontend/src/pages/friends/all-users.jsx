import { useState } from "react";
import { useAllUsers } from "../../hooks/data/friends/useAllUsers";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/auth/use-auth";
import { UserPlus, UserCheck, UserX, Loader2, Search, Users2 } from "lucide-react";
import { useAddFriend } from "@/hooks/data/friends/useAddFriend";
import { useRemoveFriend } from "@/hooks/data/friends/useRemoveFriend";
import { Input } from "@/components/ui/input";

function getInitials(username) {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

function UserCard({ user, onAdd, onRemove, loadingUser }) {
  const isLoading = loadingUser === user.id;
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-200 hover:shadow-2xl hover:shadow-primary/10">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-base shrink-0">
          {getInitials(user.username)}
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-sm truncate">@{user.username}</p>
          <p className="text-xs text-muted-foreground">User ID: {user.id?.slice(0, 8)}...</p>
        </div>
        {user.isFriend && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
            <UserCheck className="h-3 w-3" /> Friend
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        {user.isFriend ? (
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(user)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4 mr-1" />}
            Remove
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onAdd(user)}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 mr-1" />}
            Add Friend
          </Button>
        )}
      </div>
    </div>
  );
}

export default function AllUsers() {
  const { user } = useAuth();
  const { data: users, isLoading, error } = useAllUsers(user.id);
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();
  const [loadingUser, setLoadingUser] = useState(null);
  const [search, setSearch] = useState("");

  const handleAddFriend = async (friend) => {
    try {
      setLoadingUser(friend.id);
      await addFriendMutation.mutateAsync({ userId: user.id, friendId: friend.id });
    } catch (e) { console.error(e); }
    finally { setLoadingUser(null); }
  };

  const handleRemoveFriend = async (friend) => {
    try {
      setLoadingUser(friend.id);
      await removeFriendMutation.mutateAsync({ userId: user.id, friendId: friend.id });
    } catch (e) { console.error(e); }
    finally { setLoadingUser(null); }
  };

  const filtered = users?.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading users...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive gap-2">
      <p>Error: {error.message}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">All Users</h2>
          <p className="text-muted-foreground text-sm">{users?.length} people on Social Circle</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
      </div>

      {!filtered?.length ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
          <Users2 className="h-12 w-12 opacity-30" />
          <p>No users found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              onAdd={handleAddFriend}
              onRemove={handleRemoveFriend}
              loadingUser={loadingUser}
            />
          ))}
        </div>
      )}
    </div>
  );
}
