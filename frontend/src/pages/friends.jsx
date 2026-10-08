import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Search, UserCheck, UserPlus } from "lucide-react";
import useAuth from "@/hooks/auth/use-auth";
import { useFriendRequests } from "@/hooks/data/friends/useFriendRequests";
import PeopleSearch from "@/components/people/PeopleSearch";
import MyFriends from "./friends/my-friends";
import Requests from "./friends/requests";
import RecommendedFriends from "./friends/suggest-friends";

const TRIGGER =
  "flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all";

export default function Friends() {
  const { user } = useAuth();
  const { data: requests } = useFriendRequests(user?.id);
  const incoming = requests?.incoming.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Friends</h1>
        <p className="text-muted-foreground">Manage your connections and discover new people</p>
      </div>

      <Tabs defaultValue="my-friends">
        <div className="overflow-x-auto">
          <TabsList className="h-12 p-1 bg-background/50 border border-border gap-1 rounded-xl">
            <TabsTrigger value="my-friends" className={TRIGGER}>
              <UserCheck className="h-4 w-4" />
              My Friends
            </TabsTrigger>
            <TabsTrigger value="requests" className={TRIGGER}>
              <Inbox className="h-4 w-4" />
              Requests
              {incoming > 0 && (
                <span className="ml-1 min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-xs font-semibold flex items-center justify-center tabular-nums">
                  {incoming}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="discover" className={TRIGGER}>
              <Search className="h-4 w-4" />
              Discover
            </TabsTrigger>
            <TabsTrigger value="recommendations" className={TRIGGER}>
              <UserPlus className="h-4 w-4" />
              For You
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6">
          <TabsContent value="my-friends">
            <MyFriends />
          </TabsContent>
          <TabsContent value="requests">
            <Requests />
          </TabsContent>
          <TabsContent value="discover">
            <PeopleSearch />
          </TabsContent>
          <TabsContent value="recommendations">
            <RecommendedFriends />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
