import React from 'react';
import { X, Home, MessageSquare, Bell, Settings, ChevronDown, LogOut, FileText, Video, User } from "lucide-react";
import { avatarImage } from '@/lib/placeholder-images';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MarketplaceSidebar({ isOpen, onClose }) {
  const mainMenuSections = [
    {
      title: "Accueil",
      icon: <Home />,
      active: true
    },
    {
      title: "Mes annonces",
      icon: <FileText />
    }
  ];

  const notificationSections = [
    {
      title: "Messagerie",
      count: 2,
      icon: <MessageSquare />
    },
    {
      title: "Notifications",
      count: 4,
      icon: <Bell />
    }
  ];

  const otherSections = [
    {
      title: "Webinaires",
      icon: <Video />
    },
    {
      title: "Paramètres",
      icon: <Settings />
    }
  ];

  const renderNavItems = (items) => (
    items.map((item, index) => (
      <a
        key={index}
        href="#"
        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm ${
          item.active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        }`}
      >
        {React.cloneElement(item.icon, { className: 'w-4 h-4' })}
        <span>{item.title}</span>
        {item.count && (
          <span className="ml-auto bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
            {item.count}
          </span>
        )}
      </a>
    ))
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed z-20 inset-y-0 left-0 w-[240px] flex-col border-r bg-card">
        {/* Logo */}
        <div className="h-[73px] flex items-center px-6">
          <Logo />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-6">
          {/* Main menu */}
          <div className="space-y-1">
            {renderNavItems(mainMenuSections)}
          </div>

          {/* Notifications */}
          <div className="space-y-1">
            <div className="h-px bg-border mx-1 mb-2" />
            {renderNavItems(notificationSections)}
          </div>

          {/* Other */}
          <div className="space-y-1">
            <div className="h-px bg-border mx-1 mb-2" />
            {renderNavItems(otherSections)}
          </div>
        </nav>

        {/* User */}
        <div className="p-3 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full">
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                <img src={avatarImage} alt="Avatar" className="w-8 h-8 rounded-full" />
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs text-muted-foreground">john@example.com</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuItem className="gap-2">
                <User className="w-4 h-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div
        className={`lg:hidden fixed inset-0 z-50 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />

        {/* Sidebar */}
        <div
          className={`absolute inset-y-0 left-0 w-[240px] bg-card transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-[73px] flex items-center justify-between px-6">
            <Logo />
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-6 space-y-6">
            {/* Main menu */}
            <div className="space-y-1">
              {renderNavItems(mainMenuSections)}
            </div>

            {/* Notifications */}
            <div className="space-y-1">
              <div className="h-px bg-border mx-1 mb-2" />
              {renderNavItems(notificationSections)}
            </div>

            {/* Other */}
            <div className="space-y-1">
              <div className="h-px bg-border mx-1 mb-2" />
              {renderNavItems(otherSections)}
            </div>
          </nav>

          <div className="p-3 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent">
                  <img src={avatarImage} alt="Avatar" className="w-8 h-8 rounded-full" />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium">John Doe</div>
                    <div className="text-xs text-muted-foreground">john@example.com</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem className="gap-2">
                  <User className="w-4 h-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[#00A67C] rounded-lg flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M19.4 20H4.6C4.26863 20 4 19.7314 4 19.4V4.6C4 4.26863 4.26863 4 4.6 4H19.4C19.7314 4 20 4.26863 20 4.6V19.4C20 19.7314 19.7314 20 19.4 20Z" fill="white"/>
        </svg>
      </div>
      <span className="text-lg font-medium">Logoipsum</span>
    </div>
  );
}
