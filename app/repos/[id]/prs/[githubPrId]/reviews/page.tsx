import { ReviewsContainer } from "@/modules/reviews/containers/ReviewsContainer";

export default async function Reviews(
  props: PageProps<"/repos/[id]/prs/[githubPrId]/reviews">
) {
  const { id, githubPrId } = await props.params;
  return <ReviewsContainer repoId={id} githubPrId={Number(githubPrId)} />;
}
