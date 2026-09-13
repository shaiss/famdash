import { FeedPanel } from "@/components/feed-panel";
import { fetchBukzSnapshot, fetchFamPollSnapshot } from "@/lib/feeds";

export default async function DashboardPage() {
  const [bukz, fampoll] = await Promise.all([
    fetchBukzSnapshot({ limit: 4 }),
    fetchFamPollSnapshot({ limit: 4 }),
  ]);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-8">
      <div className="mb-10">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--muted)]">
          MVP shell
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)]">
          Family dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Clerk-gated surface with typed feeds. Bukz stays stubbed; FamPoll
          goes live when FAMPOLL_API_BASE_URL and FAMPOLL_API_KEY are set.
        </p>
      </div>

      <div className="space-y-10 rounded-2xl border border-[var(--line)] bg-[var(--surface)]/80 p-6 shadow-[0_1px_0_rgba(21,36,31,0.04)] sm:p-8">
        <FeedPanel snapshot={bukz} heading="Bukz" />
        <FeedPanel snapshot={fampoll} heading="FamPoll" />
      </div>
    </main>
  );
}
