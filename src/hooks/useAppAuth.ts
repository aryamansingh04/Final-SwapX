import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthUser } from "@/hooks/useAuthUser";
import { isSupabaseUserId } from "@/lib/auth";

export function useAppAuth() {
  const { user: storeUser, setUser, hasHydrated } = useAuthStore();
  const { user: supabaseUser, loading: supabaseLoading } = useAuthUser();

  useEffect(() => {
    if (supabaseUser) {
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name:
          supabaseUser.user_metadata?.full_name ??
          supabaseUser.email?.split("@")[0] ??
          "User",
        avatar: supabaseUser.user_metadata?.avatar_url,
      });
    }
  }, [supabaseUser, setUser]);

  const isLocalUser = !!(storeUser && !isSupabaseUserId(storeUser.id));
  const isAuthenticated = !!supabaseUser || isLocalUser;
  const isLoading =
    !hasHydrated || (supabaseLoading && !isLocalUser && !storeUser);

  const user =
    supabaseUser != null
      ? {
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          name:
            supabaseUser.user_metadata?.full_name ??
            supabaseUser.email?.split("@")[0] ??
            "User",
          avatar: supabaseUser.user_metadata?.avatar_url,
        }
      : storeUser;

  return {
    user,
    storeUser,
    supabaseUser,
    isAuthenticated,
    isLoading,
    isLocalUser,
    hasHydrated,
  };
}
