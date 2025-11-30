"use server";

import { Logout } from "@/modules/auth/components/Logout";
import { createSupabaseServerClient } from "../utils/supabase/server";
import { ThemeModeToggle } from "../theme/ThemeModeToggle";
import { LlmApiKeyDialog } from "../llmApiKey/LlmApiKeyDialog";
import Link from "next/link";

export async function Navbar() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <nav className="w-full h-16 bg-gray-800 text-white flex items-center px-4 gap-4 justify-around">
      <div className="text-lg font-bold">AI Code Reviewer</div>
      {user ? (
        <div className="flex items-center gap-4">
          <Link className="cursor-pointer" href="/repos">Repos</Link>
          <Link className="cursor-pointer" href="/review-rules">Review Rules</Link>
          <div>
            <LlmApiKeyDialog />
          </div>
          <div>
            <ThemeModeToggle />
          </div>
          <div>
            <Logout />
          </div>
        </div>
      ) : null}
    </nav>
  );
}
