import { Link, useNavigate } from "react-router-dom";
import { clearToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useAppAuth } from "@/hooks/useAppAuth";
import { useAuthStore } from "@/stores/useAuthStore";

const SimpleHeader = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAppAuth();
  const { logout } = useAuthStore();

  const handleSignOut = async () => {
    clearToken();
    logout();
    window.dispatchEvent(new Event("authChanged"));
    navigate("/auth/login");
    toast.success("Signed out");
  };

  if (isLoading) {
    return (
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="text-lg font-semibold">SwapX</div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold">
          SwapX
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt={user.name || "User"}
                  />
                  <AvatarFallback>
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline-block">
                  {user.email}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link to="/auth/login">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
