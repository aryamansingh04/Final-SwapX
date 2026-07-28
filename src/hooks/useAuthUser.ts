import { useState, useEffect } from "react";
import { getMeApi, getToken } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const token = getToken();
      if (!token) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { user: me } = await getMeApi();
        if (mounted) setUser(me);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    const onAuthChange = () => load();
    window.addEventListener("authChanged", onAuthChange);

    return () => {
      mounted = false;
      window.removeEventListener("authChanged", onAuthChange);
    };
  }, []);

  return { user, loading };
}
