import { NewReview } from "@/modules/reviews/components/newReview/NewReview";

export default async function NewReviewPage(
  props: PageProps<"/repos/[id]/prs/[githubPrId]/reviews/new">
) {
  const { id, githubPrId } = await props.params;
  return <NewReview repoId={id} githubPrId={Number(githubPrId)} />;
}
