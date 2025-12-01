import { RepoContainer } from "@/modules/repo/containers/RepoContainer";

export default async function Repo(props: PageProps<"/repos/[id]">) {
  const { id } = await props.params;

  return <RepoContainer repoId={id} />;
}
