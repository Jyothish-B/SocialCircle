import { Card, CardContent } from "@/components/ui/card";
import useAuth from "@/hooks/auth/use-auth";

export default function Home() {
  const { user } = useAuth();

  return (
    <>
      <h1 className="text-2xl font-semibold">
        Welcome
        <span className="font-bold"> {user.username} </span>!
      </h1>
      <p className="mt-2">This is your protected home page.</p>
      <Card className="mt-4 p-4">
        <CardContent>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </CardContent>
      </Card>
    </>
  );
}
