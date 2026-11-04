import type { Metadata } from "next";

import { ContactForm } from "@/components/forms";
import { Card, PageHero } from "@/components/ui";

export const metadata: Metadata = { title: "Get in Touch", description: "Questions, ideas, partnerships or prayer requests—we’d love to hear from you." };

export default function Contact() {
  return (
    <>
      <PageHero title="Get in Touch" lead="Have a question, suggestion, or just want to connect? We’d love to hear from you." />
      <div className="mx-auto max-w-2xl px-4 pb-20 sm:px-6">
        <Card className="p-6 sm:p-8">
          <ContactForm />
        </Card>
      </div>
    </>
  );
}
