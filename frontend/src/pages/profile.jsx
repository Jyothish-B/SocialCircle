import { useProfile } from "@/hooks/data/profile/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, Loader2, User } from "lucide-react";
import useAuth from "@/hooks/auth/use-auth";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProfile(user.id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500">
        Error loading profile
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6" />
            {profile.username}
          </CardTitle>
        </CardHeader>
      </Card>

      {profile.company && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Works at
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">{profile.company.name}</h3>
              <p className="text-sm text-muted-foreground">
                {profile.company.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.place && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Lives in
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">{profile.place.name}</h3>
              <p className="text-sm text-muted-foreground">
                {profile.place.description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
