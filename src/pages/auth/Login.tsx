import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useAuthStore } from "@/stores/useAuthStore";

import { toast } from "sonner";
import { getMyProfile } from "@/lib/profile";
import { useAppAuth } from "@/hooks/useAppAuth";
import { loginApi, setToken } from "@/lib/api";
import {
  DEMO_ACCOUNT_1_EMAIL,
  DEMO_ACCOUNT_1_PASSWORD,
  DEMO_ACCOUNT_2_EMAIL,
  DEMO_ACCOUNT_2_PASSWORD,
} from "@/lib/demo-accounts";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();

  const { setUser } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const { token, user } = await loginApi(normalizedEmail, password);
      setToken(token);
      setUser({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
      window.dispatchEvent(new Event("authChanged"));

      toast.success(`Welcome, ${user.name}!`);

      try {
        const profile = await getMyProfile();
        navigate(profile ? "/dashboard" : "/profile/setup", { replace: true });
      } catch {
        navigate("/profile/setup", { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
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
              Demo accounts (open two browsers/tabs to test together):
              <br />
              {DEMO_ACCOUNT_1_EMAIL} / {DEMO_ACCOUNT_1_PASSWORD}
              <br />
              {DEMO_ACCOUNT_2_EMAIL} / {DEMO_ACCOUNT_2_PASSWORD}
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
