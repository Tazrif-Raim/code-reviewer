import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { RepoActions } from "./RepoActions";

export function RepoCard({
  repo,
}: {
  repo: { id: string; ownerName: string; repoName: string };
}) {
  const { id, ownerName, repoName } = repo;

  return (
    <Card className="cursor-pointer">
      <CardContent className="w-96 flex flex-row justify-between items-center">
        <div>
          <div>Repo: {repoName}</div>
          <div>Owner: {ownerName}</div>
        </div>
        <RepoActions repoId={id} ownerName={ownerName} repoName={repoName} />
      </CardContent>
    </Card>
  );
}
