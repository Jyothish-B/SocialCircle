import useAuth from "@/hooks/auth/use-auth";
import { Home, LogOut, Users, User, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const links = [
  {
    title: "Profile",
    url: "/",
    icon: User,
  },
  // {
  //   title: "Home",
  //   url: "/",
  //   icon: Home,
  // },
  {
    title: "Friends",
    url: "/friends",
    icon: Heart,
  },
  {
    title: "Groups",
    url: "/groups",
    icon: Users,
  },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-sidebar-background">
      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="font-semibold text-sidebar-foreground">
            {"@" + user?.username || "something"}
          </span>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-4">
          {links.map((item) => {
            const Icon = item.icon;
            const isSelected = pathname === item.url;
            return (
              <Link
                key={item.title}
                to={item.url}
                className={`flex items-center rounded-lg px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent ${
                  isSelected ? "bg-sidebar-accent font-medium" : ""
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="ml-3">{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={logout}
          className="flex w-full items-center rounded-lg px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="h-5 w-5" />
          <span className="ml-3">Logout</span>
        </button>
      </div>
    </div>
  );
}
