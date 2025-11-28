import { Logout } from "@/modules/auth/components/Logout";
import { LlmApiKeyDialog } from "@/shared/llmApiKey/LlmApiKeyDialog";
import { ThemeModeToggle } from "@/shared/theme/ThemeModeToggle";

export default function Projects() {
  return (
    <>
      <ThemeModeToggle />
      <LlmApiKeyDialog />
      <h1>Projects Page - Protected Content</h1>
      <Logout />
    </>
  );
}
