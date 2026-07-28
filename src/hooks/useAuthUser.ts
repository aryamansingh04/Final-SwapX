import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const AUTH_TIMEOUT_MS = 2500;

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const stopLoading = () => {
      if (mounted) setLoading(false);
    };

    const timeoutId = window.setTimeout(stopLoading, AUTH_TIMEOUT_MS);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (mounted) setUser(session?.user ?? null);
      })
      .catch((error) => {
        console.warn("Supabase session check failed:", error);
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        stopLoading();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
