import { BookmarkIcon } from 'lucide-react';
import { placeholderImages } from '../lib/placeholder-images';

export function AnnouncementCard({ 
  company = "Chaned Medical",
  timeAgo = "3 sem",
  title = "Appareil d'apnée du sommeil ResMed",
  images = placeholderImages,
  tags = ["Produits parapharmaceutiques"]
}) {
  return (
    <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-medium">{company[0]}</span>
            </div>
            <span className="font-medium text-card-foreground">{company}</span>
          </div>
          <span className="text-sm text-muted-foreground">{timeAgo}</span>
        </div>
        
        <h2 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h2>
        <p className="text-muted-foreground">
          🔍 Améliorez votre sommeil avec l&apos;appareil d&apos;apnée du sommeil ResMed AirSense 11 AUTOSET! 🔍
          <br />
          Si vous avez du mal à dormir la nuit, nous avons la solution pour vous{' '}
          <button className="text-primary hover:text-primary/90">Lire plus</button>
        </p>
      </div>
      
      {/* Images */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <img 
            src={images.product1} 
            alt="Product main view" 
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="grid grid-rows-2 gap-4">
            <img 
              src={images.product2} 
              alt="Product angle view" 
              className="w-full h-full object-cover rounded-lg"
            />
            <img 
              src={images.product3} 
              alt="Product in use" 
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span 
              key={index} 
              className="inline-block px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
        <button className="text-muted-foreground hover:text-foreground">
          <BookmarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}