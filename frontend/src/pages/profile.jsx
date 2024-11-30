import { useProfile } from "@/hooks/data/profile/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Home, Loader2, User, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import useAuth from "@/hooks/auth/use-auth";
import { useState, useEffect } from "react";
import { useEditProfile } from "@/hooks/data/profile/useEditProfile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading, error } = useProfile(user.id);
  const editProfile = useEditProfile();
  const [companies, setCompanies] = useState([]);
  const [places, setPlaces] = useState([]);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", description: "" });
  const [newPlace, setNewPlace] = useState({ name: "", description: "" });

  useEffect(() => {
    const fetchEntities = async () => {
      const { data } = await api.get("/profile/entities");
      console.log(data);
      setCompanies(data.companies);
      setPlaces(data.places);
    };
    fetchEntities();
  }, []);

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

  const handleUpdateProfile = async (type, value) => {
    try {
      await editProfile.mutateAsync({
        userId: user.id,
        companyId: type === "company" ? value : profile.company?.id,
        placeId: type === "place" ? value : profile.place?.id,
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const handleCreateEntity = async (type) => {
    try {
      const payload = type === "company" ? newCompany : newPlace;
      const response = await api.post("/profile/entities", {
        ...payload,
        type: type === "company" ? "Company" : "Place",
      });
      const data = response.data;
      if (type === "company") {
        setCompanies([...companies, data]);
        handleUpdateProfile("company", data.id);
        setIsCreatingCompany(false);
        setNewCompany({ name: "", description: "" });
      } else {
        setPlaces([...places, data]);
        handleUpdateProfile("place", data.id);
        setIsCreatingPlace(false);
        setNewPlace({ name: "", description: "" });
      }
    } catch (error) {
      console.error("Failed to create entity:", error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <pre className="p-3 m-3">
        {/* {JSON.stringify({ companies, places }, null, 2)} */}
      </pre>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-6 h-6" />@{profile.username}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">
            Works at
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Company</DialogTitle>
              </DialogHeader>
              {isCreatingCompany ? (
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newCompany.name}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newCompany.description}
                      onChange={(e) =>
                        setNewCompany({
                          ...newCompany,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleCreateEntity("company")}>
                      Create
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingCompany(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={(value) =>
                      handleUpdateProfile("company", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingCompany(true)}
                  >
                    Create New Company
                  </Button>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex items-center gap-2 -mt-6">
          <Building2 className="w-5 h-5" />
          {profile.company ? (
            <div>
              <h3 className="font-semibold">{profile.company.name}</h3>
              <p className="text-sm text-muted-foreground">
                {profile.company.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No company set</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm text-muted-foreground">
            Lives in
          </CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Edit2 className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Location</DialogTitle>
              </DialogHeader>
              {isCreatingPlace ? (
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newPlace.name}
                      onChange={(e) =>
                        setNewPlace({ ...newPlace, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newPlace.description}
                      onChange={(e) =>
                        setNewPlace({
                          ...newPlace,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleCreateEntity("place")}>
                      Create
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setIsCreatingPlace(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Select
                    onValueChange={(value) =>
                      handleUpdateProfile("place", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {places.map((place) => (
                        <SelectItem key={place.id} value={place.id}>
                          {place.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatingPlace(true)}
                  >
                    Create New Place
                  </Button>
                </>
              )}
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="flex items-center gap-2 -mt-6">
          <Home className="w-5 h-5" />
          {profile.place ? (
            <div>
              <h3 className="font-semibold">{profile.place.name}</h3>
              <p className="text-sm text-muted-foreground">
                {profile.place.description}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No place set</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
