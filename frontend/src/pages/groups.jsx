import { useAllGroups } from "../hooks/data/groups/useAllGroups";
import { useMyGroups } from "../hooks/data/groups/useMyGroups";
import { useJoinGroup } from "../hooks/data/groups/useJoinGroup";
import { useQuitGroup } from "../hooks/data/groups/useQuitGroup";
import { useRecommendGroups } from "../hooks/data/groups/useRecommendGroups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useAuth from "@/hooks/auth/use-auth";
import { GroupsTable } from "@/components/groups/GroupsTable";
import { LoadingState } from "@/components/groups/StateComponents";

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

  if (isLoadingAll || isLoadingMy || isLoadingRecommended)
    return <LoadingState />;

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-6">Groups</h1>
      <Tabs defaultValue="my-groups">
        <TabsList className="w-full gap-3 h-12 mb-6">
          <TabsTrigger value="all-groups">All Groups</TabsTrigger>
          <TabsTrigger value="my-groups">My Groups</TabsTrigger>
          <TabsTrigger value="suggested-groups">Suggested Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="all-groups">
          <GroupsTable
            groups={allGroups}
            onJoin={handleJoinGroup}
            onQuit={handleQuitGroup}
          />
        </TabsContent>

        <TabsContent value="my-groups">
          <GroupsTable
            groups={myGroups}
            onJoin={handleJoinGroup}
            onQuit={handleQuitGroup}
          />
        </TabsContent>

        <TabsContent value="suggested-groups">
          <GroupsTable
            groups={recommendedGroups}
            onJoin={handleJoinGroup}
            onQuit={handleQuitGroup}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
