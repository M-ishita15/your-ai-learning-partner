import { createFileRoute } from '@tanstack/react-router';
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { readSharedScorecard } from '@/lib/practice.functions';
import { Scorecard } from '@/components/Scorecard';
const options = (token: string) => queryOptions({ queryKey: ['shared-scorecard', token], queryFn: () => readSharedScorecard({ data: { token } }) });
export const Route = createFileRoute('/scorecard/$token')({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(options(params.token)),
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? 'Shared interview'} · Coherence scorecard` }, { name: 'description', content: 'Read-only evidence-backed interview results shared by a Coherence learner.' }, { property: 'og:title', content: `${loaderData?.title ?? 'Shared interview'} · Coherence scorecard` }, { property: 'og:description', content: 'A shared interview scorecard with four scores and evidence.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }),
  component: Shared,
});
function Shared() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(options(token));
  return <main className="mx-auto max-w-4xl px-5 py-12"><p className="eyebrow">Coherence · Shared scorecard</p>{data ? <><h1 className="mt-3 text-3xl font-bold">{data.title}</h1><p className="mt-2 text-sm text-muted-foreground">{new Date(data.created_at).toLocaleDateString()} · Read only</p><Scorecard card={data.scorecard} readOnly /></> : <h1 className="mt-6 text-2xl font-bold">This scorecard is not available.</h1>}</main>;
}
