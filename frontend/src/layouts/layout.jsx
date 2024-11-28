import { Outlet, Link, useLocation } from "react-router-dom";
import useAuth from "@/hooks/auth/use-auth";
import ThemeToggler from "@/components/mode-toggle";
import { Sidebar } from "@/components/sidebar";

export default function Layout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="flex h-screen">
      {!isLoginPage && <Sidebar />}
      <main className="flex-1">
        <nav className="border-b">
          <div className="container mx-auto px-4 flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold">
              Logo
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggler />
              {isAuthenticated ? (
                <span className="text-sm"></span>
              ) : (
                <span className="text-sm">
                  {/* <Button variant="ghost" asChild>
                  <Link to="/login">Login</Link>
                </Button> */}
                </span>
              )}
            </div>
          </div>
        </nav>
        <div className="container py-8">
          <div className="p-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
