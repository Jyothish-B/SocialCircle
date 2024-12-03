import { BookmarkIcon } from 'lucide-react';
import { placeholderImages } from '../lib/placeholder-images';

export function SavedAnnouncements() {
  const savedAnnouncements = [
    {
      company: "Chaned Medical",
      timeAgo: "3 sem",
      title: "Appareil d'apnée du sommeil ResMed",
      description: " Améliorez votre sommeil avec l'appareil d'apnée du sommeil ResMed AirSense 11 AUTOSET!\nSi vous avez du mal à dormir la nuit, nous avons la solution pour vous. L'appareil d'apnée du sommeil ResMed est conçu",
      image: placeholderImages.product1
    },
    {
      company: "Chaned Medical",
      timeAgo: "3 sem",
      title: "Appareil d'apnée du sommeil ResMed",
      description: " Améliorez votre sommeil avec l'appareil d'apnée du sommeil ResMed AirSense 11 AUTOSET!\nSi vous avez du mal à dormir la nuit, nous avons la solution pour vous. L'appareil d'apnée du sommeil ResMed est conçu",
      image: placeholderImages.product1
    },
    
  ];

  return (
    <aside className="bg-card rounded-xl shadow-sm border">
      <div className="p-4 border-b flex items-center gap-2">
        <BookmarkIcon className="w-5 h-5" />
        <h2 className="font-medium text-card-foreground">
          Annonces enregistrées
        </h2>
      </div>

      <div className="divide-y">
        {savedAnnouncements.map((announcement, index) => (
          <div key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <img 
                    src={placeholderImages.companyLogo}
                    alt={announcement.company}
                    className="w-full h-full rounded-full"
                  />
                </div>
                <span className="text-sm font-medium text-card-foreground">
                  {announcement.company}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {announcement.timeAgo}
              </span>
            </div>

            <h3 className="font-medium text-base mb-2 text-card-foreground">
              {announcement.title}
            </h3>

            <div className="flex gap-3">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                  {announcement.description}
                </p>
                <button className="text-sm text-primary hover:text-primary/90">
                  Consulter l&apos;annonce
                </button>
              </div>
              <img 
                src={announcement.image}
                alt={announcement.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
