import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb, Users, HeartHandshake, BarChart3, FileText } from "lucide-react";
import { PortalHeader, ToolSection, type Tool } from "@/components/PortalCard";

export const Route = createFileRoute("/portals/advisor")({
  head: () => ({
    meta: [
      { title: "Advisor Portal — Syncora Connect" },
      { name: "description", content: "Financial advisors, CPAs, and consultants refer clients to vetted attorneys and collaborate on shared matters." },
      { property: "og:title", content: "Advisor Portal — Syncora Connect" },
      { property: "og:description", content: "Refer clients, collaborate with counsel, and track referrals across your book of business." },
    ],
  }),
  component: AdvisorPortal,
});

const REFERRALS: Tool[] = [
  { to: "/", label: "Refer a client", desc: "Send a client through the intake flow with your referral attached.", icon: Users },
  { to: "/connections", label: "Shared matters", desc: "Matters where you and an attorney are both engaged with the client.", icon: HeartHandshake },
];

const INSIGHTS: Tool[] = [
  { to: "/supply-demand", label: "Supply & demand", desc: "See where attorney capacity is short for your clients' jurisdictions.", icon: BarChart3 },
  { to: "/feedback", label: "Advisor feedback", desc: "Tell us what would make referrals easier.", icon: FileText },
];

function AdvisorPortal() {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        eyebrow="Advisor portal"
        title="Refer clients with confidence"
        blurb="For financial advisors, CPAs, and consultants. Send your clients to vetted attorneys, stay in the loop on shared matters, and track outcomes."
      />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ToolSection title="Referrals" tools={REFERRALS} />
        <ToolSection title="Insights" tools={INSIGHTS} />
        <p className="mt-10 flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Advisors are non-attorney professionals. Anything that constitutes legal
          advice must be delivered by a licensed attorney on the matter.
        </p>
      </main>
    </div>
  );
}
