import { AddRepoDialogForm } from "../components/addRepo/AddRepoDialogForm";
import { ListRepos } from "../components/listRepos/ListRepos";

export const ReposContainer = () => {
  return (
    <>
      <h1>Repos Page</h1>
      <AddRepoDialogForm />
      <div className="my-10 grid place-items-center">
        <ListRepos />
      </div>
    </>
  );
};
