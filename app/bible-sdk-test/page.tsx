import { fetchSamplePassage } from "./fetch-passage-server";
import { BibleSdkTestClient } from "./bible-sdk-test-client";
import { YouVersionProvider } from "./youversion-provider";

export const dynamic = "force-dynamic";

export default async function BibleSdkTestPage() {
  const { passage, error } = await fetchSamplePassage();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold mb-2">YouVersion SDK Test Page</h1>
          <p className="text-sm text-gray-600">
            This page exercises @youversion/platform-react-ui, @youversion/platform-react-hooks, and
            @youversion/platform-core side-by-side without touching the existing Supabase Bible flow.
          </p>
        </header>

        <YouVersionProvider>
          <BibleSdkTestClient serverPassage={passage} serverError={error} />
        </YouVersionProvider>
      </main>
    </div>
  );
}
