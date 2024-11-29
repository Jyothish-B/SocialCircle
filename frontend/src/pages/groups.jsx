import { useAllGroups } from "../hooks/data/groups/useAllGroups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import useAuth from "@/hooks/auth/use-auth";
import { InfoIcon, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const GroupCard = ({ group, onQuit, onDetails }) => (
  <Card className="hover:shadow-lg hover:border-primary/20 hover:bg-muted/50">
    <CardContent className="p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg text-primary">{group.name}</h3>
          <p className="text-sm text-muted-foreground">{group.description}</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => onDetails(group)}>
            <InfoIcon className="h-4 w-4 mr-2" />
            Details
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onQuit(group)}>
            <LogOut className="h-4 w-4 mr-2" />
            Quit
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const LoadingState = () => (
  <p className="text-lg text-center">Loading groups...</p>
);

const ErrorState = ({ error }) => (
  <p className="text-lg text-center text-destructive">Error: {error.message}</p>
);

const EmptyState = () => (
  <p className="text-lg text-center">
    You&apos;re not a member of any groups yet. Join or create a group to get
    started!
  </p>
);

export default function Groups() {
  const { user } = useAuth();
  const { data: groups, isLoading, error } = useAllGroups(user.id);

  const handleQuitGroup = (group) => {
    // TODO: Implement quit group functionality
    console.log("Quit group:", group);
  };

  const handleGroupDetails = (group) => {
    // TODO: Implement show group details functionality
    console.log("Show details for:", group);
  };

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!groups?.length) return <EmptyState />;

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6">My Groups</h1>
      <p className="text-gray-500 mb-4">Total groups: {groups.length}</p>
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <div className="space-y-4">
          {groups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onQuit={handleQuitGroup}
              onDetails={handleGroupDetails}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
