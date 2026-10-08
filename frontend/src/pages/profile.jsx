import { useProfile } from "@/hooks/data/profile/useProfile";
import { Building2, MapPin, Loader2, Edit2, User } from "lucide-react";
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

function getInitials(username) {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

function InfoCard({ icon: Icon, label, value, description, onEdit, editContent }) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
              <Edit2 className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="glass border-border">
            <DialogHeader>
              <DialogTitle>Edit {label}</DialogTitle>
            </DialogHeader>
            {editContent}
          </DialogContent>
        </Dialog>
      </div>
      {value ? (
        <div>
          <h3 className="font-semibold text-lg">{value}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      ) : (
        <p className="text-muted-foreground italic">Not set — click edit to add one</p>
      )}
    </div>
  );
}

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
      setCompanies(data.companies);
      setPlaces(data.places);
    };
    fetchEntities();
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading profile...</p>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-64 text-destructive">
      Failed to load profile.
    </div>
  );

  const handleUpdateProfile = async (type, value) => {
    try {
      await editProfile.mutateAsync({
        userId: user.id,
        companyId: type === "company" ? value : profile.company?.id,
        placeId: type === "place" ? value : profile.place?.id,
      });
    } catch (e) { console.error(e); }
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
    } catch (e) { console.error(e); }
  };

  const companyEditContent = isCreatingCompany ? (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label>Company Name</Label>
        <Input value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Input value={newCompany.description} onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleCreateEntity("company")}>Create & Set</Button>
        <Button variant="ghost" onClick={() => setIsCreatingCompany(false)}>Cancel</Button>
      </div>
    </div>
  ) : (
    <div className="space-y-4 pt-2">
      <Select onValueChange={(value) => handleUpdateProfile("company", value)}>
        <SelectTrigger><SelectValue placeholder="Select a company" /></SelectTrigger>
        <SelectContent>
          {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" className="w-full" onClick={() => setIsCreatingCompany(true)}>+ Create New Company</Button>
    </div>
  );

  const placeEditContent = isCreatingPlace ? (
    <div className="space-y-4 pt-2">
      <div className="space-y-1">
        <Label>City / Place Name</Label>
        <Input value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} />
      </div>
      <div className="space-y-1">
        <Label>Description</Label>
        <Input value={newPlace.description} onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })} />
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleCreateEntity("place")}>Create & Set</Button>
        <Button variant="ghost" onClick={() => setIsCreatingPlace(false)}>Cancel</Button>
      </div>
    </div>
  ) : (
    <div className="space-y-4 pt-2">
      <Select onValueChange={(value) => handleUpdateProfile("place", value)}>
        <SelectTrigger><SelectValue placeholder="Select a city" /></SelectTrigger>
        <SelectContent>
          {places.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>
      <Button variant="outline" className="w-full" onClick={() => setIsCreatingPlace(true)}>+ Create New Place</Button>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Profile Header */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40" />
        <div className="px-6 pb-6 -mt-10">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-2xl border-4 border-background shadow-xl">
            {getInitials(profile.username)}
          </div>
          <div className="mt-3">
            <h1 className="text-2xl font-heading font-bold">@{profile.username}</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1 mt-1">
              <User className="h-3 w-3" /> Member of Social Circle
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          icon={Building2}
          label="Works at"
          value={profile.company?.name}
          description={profile.company?.description}
          editContent={companyEditContent}
        />
        <InfoCard
          icon={MapPin}
          label="Lives in"
          value={profile.place?.name}
          description={profile.place?.description}
          editContent={placeEditContent}
        />
      </div>
    </div>
  );
}
