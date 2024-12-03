import { Search, Plus, Menu, Sun, Moon, Filter } from 'lucide-react';
import { useTheme } from "@/providers/theme-provider";

export function MarketplaceHeader({ onMenuClick }) {
  const { theme, setTheme } = useTheme();
  return (
    <div className="sticky top-0 bg-background z-30 border-b">
      <header className="px-4 py-4 lg:px-8 lg:py-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-accent rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher sur la plateforme"
              className="w-full pl-9 pr-4 py-2 bg-accent/50 hover:bg-accent focus:bg-background border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 rounded-lg text-sm font-medium">
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <button 
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-accent rounded-lg"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button className="hidden md:flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />
              Publier une annonce
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
