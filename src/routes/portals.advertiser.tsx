import { createFileRoute } from "@tanstack/react-router";
import { Megaphone, BarChart3, Target, FileText } from "lucide-react";
import { PortalHeader, ToolSection, type Tool } from "@/components/PortalCard";

export const Route = createFileRoute("/portals/advertiser")({
  head: () => ({
    meta: [
      { title: "Advertiser Portal — Syncora Connect" },
      { name: "description", content: "Place sponsored placements in front of vetted legal-services audiences and review delivery analytics." },
      { property: "og:title", content: "Advertiser Portal — Syncora Connect" },
      { property: "og:description", content: "Reach clients, professionals, and agency staff with targeted placements. Transparent analytics." },
    ],
  }),
  component: AdvertiserPortal,
});

const CAMPAIGNS: Tool[] = [
  { to: "/advertise", label: "Manage placements", desc: "Create and edit sponsored placements across Syncora surfaces.", icon: Megaphone },
  { to: "/advertise", label: "Targeting", desc: "Pick audience segments by role, specialty, and jurisdiction.", icon: Target },
];
const INSIGHTS: Tool[] = [
  { to: "/advertise", label: "Delivery analytics", desc: "Impressions, click-through, and segment breakdown by placement.", icon: BarChart3 },
  { to: "/feedback", label: "Advertiser feedback", desc: "Request new audience segments or formats.", icon: FileText },
];

function AdvertiserPortal() {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        eyebrow="Advertiser portal"
        title="Reach the right legal audience"
        blurb="For sponsors, partners, and vendors. Place sponsored content in front of clients, professionals, and agency staff — and see how it performs."
      />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ToolSection title="Campaigns" tools={CAMPAIGNS} />
        <ToolSection title="Insights" tools={INSIGHTS} />
      </main>
    </div>
  );
}
