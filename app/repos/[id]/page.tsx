export default async function Repo(props: PageProps<"/repos/[id]">) {
  const { id } = await props.params;

  return <div>Repo Page - {id}</div>;
}
