import useAuth from "@/hooks/auth/use-auth";
import { Users, User, CircleUserRound, Network, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const links = [
  {
    title: "Profile",
    url: "/profile",
    icon: User,
    description: "Your personal info",
  },
  {
    title: "Friends",
    url: "/friends",
    icon: CircleUserRound,
    description: "Manage connections",
  },
  {
    title: "People",
    url: "/people",
    icon: Search,
    description: "Search the network",
  },
  {
    title: "Groups",
    url: "/groups",
    icon: Users,
    description: "Your communities",
  },
  {
    title: "Explorer",
    url: "/explorer",
    icon: Network,
    description: "Graph visualization",
  },
];

function getInitials(username) {
  if (!username) return "?";
  return username.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="hidden md:flex h-screen w-64 flex-col glass-panel border-r border-l-0 border-y-0 rounded-none shrink-0">
      {/* Logo area */}
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <span className="font-heading font-bold text-lg text-gradient">
          Social Circle
        </span>
      </div>

      {/* User info */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm shrink-0">
            {getInitials(user?.username)}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">@{user?.username}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
              Online
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {links.map((item) => {
          const Icon = item.icon;
          const isSelected =
            pathname === item.url ||
            (item.url !== "/" && pathname.startsWith(item.url));
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group
                ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-foreground/70 hover:bg-primary/10 hover:text-foreground"
                }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isSelected ? "text-primary-foreground" : ""}`}
              />
              <div>
                <p className="text-sm font-medium leading-none">{item.title}</p>
                <p
                  className={`text-xs mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                >
                  {item.description}
                </p>
              </div>
              {isSelected && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground/80"></div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// Below the md breakpoint the sidebar is hidden and this tab bar takes over
export function MobileNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Main"
      className="md:hidden fixed bottom-0 inset-x-0 z-30 glass-panel border-t border-x-0 border-b-0 rounded-none grid grid-cols-5 pb-[env(safe-area-inset-bottom)]"
    >
      {links.map((item) => {
        const Icon = item.icon;
        const isSelected = pathname === item.url || pathname.startsWith(item.url + "/");
        return (
          <Link
            key={item.title}
            to={item.url}
            aria-current={isSelected ? "page" : undefined}
            className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
              isSelected ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
