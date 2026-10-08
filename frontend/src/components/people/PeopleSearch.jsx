import { useState } from "react";
import { Loader2, Search, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import useAuth from "@/hooks/auth/use-auth";
import { useSearchPeople } from "@/hooks/data/people/useSearchPeople";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import PersonCard from "./PersonCard";

export default function PeopleSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 250);
  const { data: people, isLoading, isFetching, error } = useSearchPeople(user?.id, debounced);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold">
            {debounced ? `Results for "${debounced}"` : "People you may know"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {debounced
              ? "Matching names, usernames and bios across the network"
              : "Ranked by how many friends you already share"}
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <label htmlFor="people-search" className="sr-only">
            Search people
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="people-search"
            placeholder="Search by name, username or bio"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9 bg-background/50"
            autoComplete="off"
          />
          {isFetching && !isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      {error ? (
        <p className="text-destructive">Search failed: {error.message}. Check that the backend is running.</p>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : !people?.length ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground">
          <SearchX className="h-12 w-12 opacity-30" />
          <p>
            {debounced
              ? `Nobody matches "${debounced}". Try a first name or an interest.`
              : "Add a friend to see people you may know."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {people.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
}
