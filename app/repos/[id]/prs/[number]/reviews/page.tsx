import { ReviewsContainer } from "@/modules/reviews/containers/ReviewsContainer";

export default async function Reviews(
  props: PageProps<"/repos/[id]/prs/[number]/reviews">
) {
  const { id, number } = await props.params;
  return <ReviewsContainer repoId={id} githubPrNumber={Number(number)} />;
}
