import { useAllGroups } from "../hooks/data/groups/useAllGroups";
import { useMyGroups } from "../hooks/data/groups/useMyGroups";
import { useJoinGroup } from "../hooks/data/groups/useJoinGroup";
import { useQuitGroup } from "../hooks/data/groups/useQuitGroup";
import { useRecommendGroups } from "../hooks/data/groups/useRecommendGroups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/auth/use-auth";
import { GroupsTable } from "@/components/groups/GroupsTable";
import { Loader2 } from "lucide-react";
import { Users2, Star, LayoutGrid } from "lucide-react";

export default function Groups() {
  const { user } = useAuth();
  const { data: allGroups, isLoading: isLoadingAll } = useAllGroups(user?.id);
  const { data: myGroups, isLoading: isLoadingMy } = useMyGroups(user?.id);
  const { data: recommendedGroups, isLoading: isLoadingRecommended } =
    useRecommendGroups(user?.id);
  const joinGroup = useJoinGroup();
  const quitGroup = useQuitGroup();

  const handleJoinGroup = async (group) => {
    await joinGroup.mutateAsync({ userId: user.id, groupId: group.id });
  };

  const handleQuitGroup = async (group) => {
    await quitGroup.mutateAsync({ userId: user.id, groupId: group.id });
  };

  if (isLoadingAll || isLoadingMy || isLoadingRecommended) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading groups...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Groups</h1>
        <p className="text-muted-foreground">Join communities and connect with like-minded people</p>
      </div>

      <Tabs defaultValue="my-groups">
        <TabsList className="h-12 p-1 bg-background/50 border border-border gap-1 rounded-xl">
          <TabsTrigger
            value="my-groups"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <Users2 className="h-4 w-4" />
            My Groups
          </TabsTrigger>
          <TabsTrigger
            value="all-groups"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <LayoutGrid className="h-4 w-4" />
            All Groups
          </TabsTrigger>
          <TabsTrigger
            value="suggested-groups"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
          >
            <Star className="h-4 w-4" />
            Suggested
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="all-groups">
            <GroupsTable groups={allGroups} onJoin={handleJoinGroup} onQuit={handleQuitGroup} />
          </TabsContent>
          <TabsContent value="my-groups">
            <GroupsTable groups={myGroups} onJoin={handleJoinGroup} onQuit={handleQuitGroup} />
          </TabsContent>
          <TabsContent value="suggested-groups">
            <GroupsTable groups={recommendedGroups} onJoin={handleJoinGroup} onQuit={handleQuitGroup} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
