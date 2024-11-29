import { useState } from "react";
import { useAllUsers } from "../../hooks/data/friends/useAllUsers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useAuth from "@/hooks/auth/use-auth";
import {
  InfoIcon,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX2,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddFriend } from "@/hooks/data/friends/useAddFriend";
import { useRemoveFriend } from "@/hooks/data/friends/useRemoveFriend";

const LoadingState = () => (
  <p className="text-lg text-center">Loading users...</p>
);

const ErrorState = ({ error }) => (
  <p className="text-lg text-center text-destructive">Error: {error.message}</p>
);

const EmptyState = () => <p className="text-lg text-center">No users found.</p>;

const UserDetailsDialog = ({ isOpen, onClose, user }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          User Details
          {user?.isFriend ? (
            <>
              <UserCheck className="h-5 w-5 text-green-500" />
              <span className="text-sm font-normal text-green-500">Friend</span>
            </>
          ) : (
            <>
              <UserX2 className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-normal text-gray-400">
                Not Friend
              </span>
            </>
          )}
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <p>
          <strong>Username:</strong> @{user?.username}
        </p>
        <p>
          <strong>User ID:</strong> {user?.id}
        </p>
        {/* Add more user details as needed */}
      </div>
    </DialogContent>
  </Dialog>
);

const UserCard = ({ user, onAdd, onRemove, onDetails, isLoading }) => (
  <Card className="hover:bg-muted/50 hover:shadow-lg hover:border-primary/20">
    <CardContent className="p-4 flex justify-between items-center">
      <h3 className="font-semibold text-primary">@{user.username}</h3>
      <div className="space-x-2">
        {user.isFriend ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onRemove(user)}
            disabled={isLoading === user.id}
          >
            {isLoading === user.id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserMinus className="h-4 w-4 mr-2" />
            )}
            Remove Friend
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onAdd(user)}
            disabled={isLoading === user.id}
          >
            {isLoading === user.id ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4 mr-2" />
            )}
            Add Friend
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onDetails(user)}>
          <InfoIcon className="h-4 w-4 mr-2" />
          Details
        </Button>
      </div>
    </CardContent>
  </Card>
);

export default function AllUsers() {
  const { user } = useAuth();
  const { data: users, isLoading, error } = useAllUsers(user.id);
  const [selectedUser, setSelectedUser] = useState(null);
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();
  const [loadingUser, setLoadingUser] = useState(null);

  const handleAddFriend = async (friend) => {
    try {
      setLoadingUser(friend.id);
      await addFriendMutation.mutateAsync({
        userId: user.id,
        friendId: friend.id,
      });
    } catch (error) {
      console.error("Failed to add friend:", error);
    } finally {
      setLoadingUser(null);
    }
  };

  const handleUserDetails = (user) => {
    setSelectedUser(user);
  };

  const handleRemoveFriend = async (friend) => {
    try {
      setLoadingUser(friend.id);
      await removeFriendMutation.mutateAsync({
        userId: user.id,
        friendId: friend.id,
      });
    } catch (error) {
      console.error("Failed to remove friend:", error);
    } finally {
      setLoadingUser(null);
    }
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!users?.length) return <EmptyState />;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">All Users</h1>
      <p className="text-gray-500 mb-4">Total users: {users.length}</p>
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onAdd={handleAddFriend}
              onRemove={handleRemoveFriend}
              onDetails={handleUserDetails}
              isLoading={loadingUser}
            />
          ))}
        </div>
      </ScrollArea>
      <UserDetailsDialog
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  );
}
