import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserCheck, UserPlus } from "lucide-react";
import AllUsers from "./friends/all-users";
import MyFriends from "./friends/my-friends";
import RecommendedFriends from "./friends/suggest-friends";

export default function Friends() {
  return (
    <div className="container">
      <Tabs defaultValue="my-friends">
        <TabsList className="w-full bg-azeaze gap-3 h-12 mb-6">
          <TabsTrigger value="my-friends">
            <UserCheck className="h-8 w-4 mr-2" />
            My Friends
          </TabsTrigger>
          <TabsTrigger value="all-users">
            <Users className="h-8 w-4 mr-2" />
            All Users
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <UserPlus className="h-8 w-4 mr-2" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-friends">
          <MyFriends />
        </TabsContent>

        <TabsContent value="all-users">
          <AllUsers />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendedFriends />
        </TabsContent>
      </Tabs>
    </div>
  );
}
