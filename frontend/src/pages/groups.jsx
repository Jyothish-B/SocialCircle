import { useAllGroups } from "../hooks/data/groups/useAllGroups";
import { useJoinGroup } from "../hooks/data/groups/useJoinGroup";
import { useQuitGroup } from "../hooks/data/groups/useQuitGroup";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/auth/use-auth";
import { InfoIcon, LogOut, PlusCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const GroupCard = ({ group, onJoin, onQuit, onDetails, isMember }) => (
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
          {isMember ? (
            <Button variant="destructive" size="sm" onClick={() => onQuit(group)}>
              <LogOut className="h-4 w-4 mr-2" />
              Quit
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={() => onJoin(group)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Join
            </Button>
          )}
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
  const joinGroup = useJoinGroup();
  const quitGroup = useQuitGroup();

  const handleJoinGroup = (group) => {
    joinGroup.mutate({ userId: user.id, groupId: group.id });
  };

  const handleQuitGroup = (group) => {
    quitGroup.mutate({ userId: user.id, groupId: group.id });
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
      <h1 className="text-3xl font-bold mb-6">Groups</h1>
      <Tabs defaultValue="my-groups">
        <TabsList className="w-full bg-azeaze gap-3 h-12 mb-6">
          <TabsTrigger value="all-groups">All Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="suggest-groups">Suggest Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="all-groups">
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={handleJoinGroup}
                  onQuit={handleQuitGroup}
                  onDetails={handleGroupDetails}
                  isMember={false}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="my-groups">
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onJoin={handleJoinGroup}
                  onQuit={handleQuitGroup}
                  onDetails={handleGroupDetails}
                  isMember={true}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="suggest-groups">
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {/* TODO: Implement suggested groups functionality */}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
