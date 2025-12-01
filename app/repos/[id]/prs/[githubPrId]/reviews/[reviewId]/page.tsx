export default async function ReviewComments(
  props: PageProps<"/repos/[id]/prs/[githubPrId]/reviews/[reviewId]">
) {
  const { reviewId } = await props.params;
  return <div>Repo Page Review {reviewId}</div>;
}
