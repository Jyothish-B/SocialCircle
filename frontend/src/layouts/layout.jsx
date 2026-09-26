import { Outlet, Link, useLocation } from "react-router-dom";
import useAuth from "@/hooks/auth/use-auth";
import ThemeToggler from "@/components/mode-toggle";
import { Sidebar } from "@/components/sidebar";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Subtle global background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      
      {!isLoginPage && <Sidebar />}
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <nav className="h-16 flex-shrink-0 glass-panel border-b border-x-0 border-t-0 rounded-none z-20">
          <div className="h-full px-6 flex justify-between items-center">
            <Link to="/" className="text-2xl font-heading font-bold text-gradient flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary fill-primary" />
              Social Circle
            </Link>
            <div className="flex items-center gap-6">
              <ThemeToggler />
              {isAuthenticated && user && (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold">{user.username}</span>
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={logout} className="border-primary/20 hover:bg-primary/10">
                    Log out
                  </Button>
                </div>
              )}
            </div>
          </div>
        </nav>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-10">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
