import { useAuthStore } from "@/stores/useAuthStore";
import { useAuthUser } from "@/hooks/useAuthUser";

export function useAppAuth() {
  const { user: storeUser, hasHydrated } = useAuthStore();
  const { user: jwtUser, loading: jwtLoading } = useAuthUser();

  const user = jwtUser ?? storeUser;
  const isAuthenticated = !!user;
  const isLoading = !hasHydrated || jwtLoading;
  const isLocalUser = isAuthenticated;

  return {
    user,
    storeUser,
    supabaseUser: null,
    isAuthenticated,
    isLoading,
    isLocalUser,
    hasHydrated,
  };
}
