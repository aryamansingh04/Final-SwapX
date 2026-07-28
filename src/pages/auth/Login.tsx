import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuthStore } from "@/stores/useAuthStore";
import { useProfileStore } from "@/stores/useProfileStore";

import { toast } from "sonner";
import { generateUserIdFromEmail } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/lib/profile";
import { useAppAuth } from "@/hooks/useAppAuth";

const DEMO_EMAIL = "demo@swapx.com";
const DEMO_PASSWORD = "Demo@123";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, isLocalUser } = useAppAuth();

  const { setUser } = useAuthStore();
  const { getProfile } = useProfileStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(isLocalUser ? "/dashboard" : "/home", { replace: true });
    }
  }, [authLoading, isAuthenticated, isLocalUser, navigate]);

  const handleDemoLogin = () => {
    let profile = getProfile(generateUserIdFromEmail(DEMO_EMAIL));

    if (!profile) {
      profile = {
        id: generateUserIdFromEmail(DEMO_EMAIL),
        email: DEMO_EMAIL,
        name: "Demo User",
        skills: [],
        skillsToLearn: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    setUser({
      id: profile.id,
      email: profile.email,
      name: profile.name,
    });

    toast.success("Welcome to SwapX!");
    navigate("/dashboard");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail === DEMO_EMAIL && password === DEMO_PASSWORD) {
      handleDemoLogin();
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      toast.error(error.message || "Invalid email or password");
      setIsLoading(false);
      return;
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email ?? normalizedEmail,
        name:
          data.user.user_metadata?.full_name ??
          data.user.email?.split("@")[0] ??
          "User",
        avatar: data.user.user_metadata?.avatar_url,
      });

      toast.success("Welcome to SwapX!");

      try {
        const profile = await getMyProfile();
        navigate(profile ? "/home" : "/profile/setup", { replace: true });
      } catch {
        navigate("/profile/setup", { replace: true });
      }
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-soft)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[image:var(--gradient-soft)]">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Demo Credentials:
              <br />
              demo@swapx.com
              <br />
              Demo@123
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <Label>Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Login"}
              </Button>

              <div className="text-center text-sm mt-4">
                <Link to="/auth/signup">
                  Create Account
                </Link>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
