'use client';

import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/utils/supabase/client";

export function Login() {
  const supabase = createSupabaseBrowserClient();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=/projects`,
      },
    });
  };

  return <Button onClick={handleLogin}>Login with Google</Button>;
}
