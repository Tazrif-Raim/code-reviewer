import { AddRepoDialogForm } from "../components/addRepo/AddRepoDialogForm";
import { ListRepos } from "../components/listRepos/ListRepos";

export const ReposContainer = () => {
  return (
    <>
      <AddRepoDialogForm />
      <div className="my-10 grid place-items-center">
        <ListRepos />
      </div>
    </>
  );
};
