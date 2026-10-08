import PeopleSearch from "@/components/people/PeopleSearch";

export default function People() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">People</h1>
        <p className="text-muted-foreground">Find anyone in the network and see how you&apos;re connected</p>
      </div>
      <PeopleSearch />
    </div>
  );
}
