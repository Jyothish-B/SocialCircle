import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogOut, PlusCircle, Loader2, InfoIcon, Users } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GroupDetailsDialog = ({ isOpen, onClose, group }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          Group Details
          <Users className="h-5 w-5 text-primary" />
        </DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <p className="font-semibold">Name:</p>
          <p>{group?.name}</p>
        </div>
        <div>
          <p className="font-semibold">Description:</p>
          <p>{group?.description}</p>
        </div>
        <div>
          <p className="font-semibold">Members ({group?.members.length}):</p>
          <ScrollArea className="h-[200px] w-full border rounded-md p-4">
            <ul className="space-y-2">
              {group?.members.map((member) => (
                <li key={member.id}>@{member.username}</li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const GroupActionButton = ({ group, onJoin, onQuit }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      await (group.isMember ? onQuit(group) : onJoin(group));
    } finally {
      setIsLoading(false);
    }
  };

  return !group.isMember ? (
    <Button size="sm" onClick={handleAction} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <PlusCircle className="h-4 w-4 mr-2" />
      )}
      Join
    </Button>
  ) : (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleAction}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4 mr-2" />
      )}
      Quit
    </Button>
  );
};

export const GroupsTable = ({ groups, onJoin, onQuit }) => {
  const [selectedGroup, setSelectedGroup] = useState(null);

  return (
    <>
      <ScrollArea className="h-[400px] rounded-md border p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Members</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups?.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.description}</TableCell>
                <TableCell>{group.members.length}</TableCell>
                <TableCell className="text-right">
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedGroup(group)}
                    >
                      <InfoIcon className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <GroupActionButton
                      group={group}
                      onJoin={onJoin}
                      onQuit={onQuit}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
      <GroupDetailsDialog
        isOpen={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        group={selectedGroup}
      />
    </>
  );
};
