import { Logout } from "@/modules/auth/components/Logout";
import { LlmApiKeyDialog } from "@/shared/llmApiKey/LlmApiKeyDialog";
import { AddRepoDialogForm } from "../components/addRepo/AddRepoDialogForm";
import { ListRepos } from "../components/listRepos/ListRepos";

export const ReposContainer = () => {
  return (
    <>
      <LlmApiKeyDialog />
      <Logout />
      <h1>Repos Page</h1>
      <AddRepoDialogForm />
      <div className="my-10 grid place-items-center">
        <ListRepos />
      </div>
    </>
  );
};
