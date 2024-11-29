import { useState } from "react";
import { useAllFriends } from "../../hooks/data/friends/useAllFriends";
import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
import useAuth from "@/hooks/auth/use-auth";
import { InfoIcon, UserX, UserCheck, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRemoveFriend } from "@/hooks/data/friends/useRemoveFriend";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const LoadingState = () => (
  <p className="text-lg text-center">Loading friends...</p>
);

const ErrorState = ({ error }) => (
  <p className="text-lg text-center text-destructive">Error: {error.message}</p>
);

const EmptyState = () => (
  <p className="text-lg text-center">
    No friends found. Start adding some friends!
  </p>
);

const UserDetailsDialog = ({ isOpen, onClose, user }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          User Details
          <UserCheck className="h-5 w-5 text-green-500" />
          <span className="text-sm font-normal text-green-500">Friend</span>
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

export default function MyFriends() {
  const { user } = useAuth();
  const { data: friends, isLoading, error } = useAllFriends(user.id);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const removeFriendMutation = useRemoveFriend();
  const [removingFriend, setRemovingFriend] = useState(null);

  const handleRemoveFriend = async (friend) => {
    try {
      setRemovingFriend(friend.id);
      await removeFriendMutation.mutateAsync({
        userId: user.id,
        friendId: friend.id,
      });
    } catch (error) {
      console.error("Failed to remove friend:", error);
    } finally {
      setRemovingFriend(null);
    }
  };

  const handleFriendDetails = (friend) => {
    setSelectedFriend(friend);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!friends?.length) return <EmptyState />;

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-3xl font-bold mb-6">My Friends</h1>
      <p className="text-gray-500 mb-4">Total friends: {friends.length}</p>
      <ScrollArea className="h-[calc(100vh-24rem)] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-background sticky top-0">
                User ID
              </TableHead>
              <TableHead className="bg-background sticky top-0">
                Username
              </TableHead>
              <TableHead className="bg-background sticky top-0 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {friends.map((friend) => (
              <TableRow key={friend.id}>
                <TableCell>{friend.id}</TableCell>
                <TableCell>@{friend.username}</TableCell>
                <TableCell className="text-right">
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFriendDetails(friend)}
                    >
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFriend(friend)}
                      disabled={removingFriend === friend.id}
                    >
                      {removingFriend === friend.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserX className="h-4 w-4 mr-2" />
                      )}
                      Remove
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <UserDetailsDialog
        isOpen={!!selectedFriend}
        onClose={() => setSelectedFriend(null)}
        user={selectedFriend}
      />
    </div>
  );
}
