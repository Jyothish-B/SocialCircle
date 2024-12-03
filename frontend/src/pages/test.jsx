import { MarketplaceLayout } from "@/components/MarketplaceLayout";
import { AnnouncementCard } from "@/components/AnnouncementCard";
import { SavedAnnouncements } from "@/components/SavedAnnouncements";

export default function Test() {
  return (
    <MarketplaceLayout>
      <div className="px-4 py-6 lg:px-8">
        <h1 className="text-2xl font-semibold mb-6 text-foreground">
          Annonces de Vente
        </h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-[1fr,420px] gap-8">
          <div className="grid gap-6 lg:grid-cols-1">
            <AnnouncementCard />
            <AnnouncementCard />
            <AnnouncementCard />
          </div>

          {/* Saved Announcements */}
          <div className="hidden xl:block">
            {/* <div className="sticky top-[5.5rem]"> */}
            <div className="sticky">
              <SavedAnnouncements />
            </div>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
