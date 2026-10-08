import { Button } from "@/components/ui/button";
import { Users2, UserPlus, LogOut, Loader2, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const GROUP_GRADIENTS = [
  "from-violet-500 to-indigo-600",
  "from-blue-500 to-cyan-500",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-emerald-500",
  "from-fuchsia-500 to-purple-600",
];

function getGroupGradient(id) {
  const idx = id ? parseInt(String(id).replace(/\D/g, "").slice(0, 4) || "0") % GROUP_GRADIENTS.length : 0;
  return GROUP_GRADIENTS[idx];
}

function getInitials(name) {
  if (!name) return "G";
  return name.slice(0, 2).toUpperCase();
}

function GroupCard({ group, onJoin, onQuit }) {
  const [loading, setLoading] = useState(false);
  const gradient = getGroupGradient(group.id);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await action(group);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-200 hover:shadow-2xl hover:shadow-primary/10">
      <div className={`h-20 bg-gradient-to-r ${gradient} relative flex items-center justify-center`}>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_white_0%,_transparent_70%)]" />
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-xl">
          {getInitials(group.name)}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold truncate">{group.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {group.description || "No description available."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs gap-1">
            <Users2 className="h-3 w-3" />
            {group.memberCount ?? "?"} members
          </Badge>
          {group.isMember && (
            <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20 border">
              <Crown className="h-3 w-3 mr-1" /> Member
            </Badge>
          )}
        </div>

        {group.isMember ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => handleAction(onQuit)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <LogOut className="h-4 w-4 mr-1" />}
            Leave Group
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={() => handleAction(onJoin)}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
            Join Group
          </Button>
        )}
      </div>
    </div>
  );
}

export function GroupsTable({ groups, onJoin, onQuit }) {
  if (!groups?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
        <Users2 className="h-12 w-12 opacity-20" />
        <p>No groups found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} onJoin={onJoin} onQuit={onQuit} />
      ))}
    </div>
  );
}
