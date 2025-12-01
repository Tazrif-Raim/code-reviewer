import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListGithubPrs } from "../components/ListGithubPrs/ListGithubPrs";
import { ListReviewedPrs } from "../components/ListReviewedPrs/ListReviewedPrs";

export function RepoContainer({ repoId }: { repoId: string }) {
  return (
    <div className="grid place-items-center my-10">
      <Tabs defaultValue="github" className="w-[400px] grid place-items-center">
        <TabsList>
          <TabsTrigger value="github">Github</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>
        <TabsContent value="github">
          <ListGithubPrs repoId={repoId} />
        </TabsContent>
        <TabsContent value="reviewed"><ListReviewedPrs id={repoId} /></TabsContent>
      </Tabs>
    </div>
  );
}
