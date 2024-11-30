import { useRecommendFriends } from "@/hooks/data/friends/useRecommendFriends";
import useAuth from "@/hooks/auth/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InfoIcon, UserPlus, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddFriend } from "@/hooks/data/friends/useAddFriend";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const LoadingState = () => (
  <p className="text-lg text-center">Loading suggested friends...</p>
);

const ErrorState = ({ error }) => (
  <p className="text-lg text-center text-destructive">Error: {error.message}</p>
);

const EmptyState = () => (
  <p className="text-lg text-center">No suggested friends found.</p>
);

// Add UserDetailsDialog component
const UserDetailsDialog = ({ isOpen, onClose, user }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>User Details</DialogTitle>
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

// Modify the SuggestedFriends component
export default function SuggestedFriends() {
  const { user } = useAuth();
  const {
    data: suggestedFriends,
    isLoading,
    error,
  } = useRecommendFriends(user?.id);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(null);
  const addFriendMutation = useAddFriend();

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

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!suggestedFriends?.length) return <EmptyState />;

  return (
    <div className="h-full flex flex-col">
      {/* <pre className="p-3 m-3">{JSON.stringify(suggestedFriends, null, 2)}</pre> */}
      <h1 className="text-3xl font-bold mb-6">Suggested Friends</h1>
      <p className="text-gray-500 mb-4">
        Total suggested friends: {suggestedFriends.length}
      </p>
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
            {suggestedFriends.map((friend) => (
              <TableRow key={friend.id}>
                <TableCell>{friend.id}</TableCell>
                <TableCell>@{friend.username}</TableCell>
                <TableCell className="text-right">
                  <div className="space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAddFriend(friend)}
                      disabled={loadingUser === friend.id}
                    >
                      {loadingUser === friend.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      Add Friend
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUserDetails(friend)}
                    >
                      <InfoIcon className="h-4 w-4" />
                      Details
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <UserDetailsDialog
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        user={selectedUser}
      />
    </div>
  );
}
