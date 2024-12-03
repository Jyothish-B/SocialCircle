import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Home,
  FolderClosed,
  File,
  // ChevronDown,
  ArrowUp,
  RefreshCw,
  Plus,
  Copy,
  Link,
  Trash,
  MoreHorizontal,
  // Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

const Explorer = () => {
  const [items] = useState([
    { name: "git", type: "folder", dateModified: "11/30/2024 8:12 PM", size: "" },
    { name: "backend", type: "folder", dateModified: "11/28/2024 10:32 PM", size: "" },
    { name: "frontend", type: "folder", dateModified: "11/28/2024 7:45 PM", size: "" },
    { name: ".gitignore", type: "file", dateModified: "11/28/2024 10:34 PM", size: "1 KB" },
    { name: "README.md", type: "file", dateModified: "11/28/2024 10:35 PM", size: "1 KB" },
  ]);

  return (
    <div className="h-screen flex flex-col">
      {/* Top Navigation */}
      <div className="border-b p-2 flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="flex-1 flex items-center gap-2 px-2">
          <Home className="h-4 w-4" />
          <span>neo4j project</span>
        </div>
        <Input 
          className="max-w-xs"
          placeholder="Search neo4j project"
          type="search"
        />
      </div>

      {/* Action Bar */}
      <div className="border-b p-2 flex items-center gap-2">
        <Button variant="ghost" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New
        </Button>
        <Button variant="ghost" size="icon">
          <Copy className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Link className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Trash className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      {/* File List */}
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Name</TableHead>
              <TableHead>Date modified</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {item.type === "folder" ? (
                      <FolderClosed className="h-4 w-4" />
                    ) : (
                      <File className="h-4 w-4" />
                    )}
                    {item.name}
                  </div>
                </TableCell>
                <TableCell>{item.dateModified}</TableCell>
                <TableCell>{item.type === "folder" ? "File folder" : "File"}</TableCell>
                <TableCell>{item.size}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default Explorer;
