import type { Metadata } from "next";

import { SuggestionForm } from "@/components/forms";
import { Card, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Suggestion Box", description: "Share ideas and feedback to help the community grow." };

export default function Suggestions() {
  return (
    <>
      <PageHero
        title="Suggestion Box"
        lead="We value your input! Share ideas, feedback, or suggestions to help us grow and serve the community better."
      />
      <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <Card className="p-6 sm:p-8">
          <SuggestionForm />
        </Card>
      </div>
    </>
  );
}
