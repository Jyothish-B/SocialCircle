import { useState } from 'react';
import { MarketplaceSidebar } from './MarketplaceSidebar';
import { MarketplaceHeader } from './MarketplaceHeader';

export function MarketplaceLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop (fixed) and Mobile (slide-over) */}
      <MarketplaceSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {/* Main content */}
      <div className="flex-1 lg:pl-[240px]">
        <MarketplaceHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}
