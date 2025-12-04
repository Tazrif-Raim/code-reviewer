import { NewReview } from "@/modules/reviews/components/newReview/NewReview";

export const maxDuration = 60;

export default async function NewReviewPage(
  props: PageProps<"/repos/[id]/prs/[number]/reviews/new">
) {
  const { id, number } = await props.params;
  return <NewReview repoId={id} githubPrNumber={Number(number)} />;
}
