import { createFileRoute } from "@tanstack/react-router";
import { Search, FolderOpen, FileText, Star, MessageSquare, ShieldAlert, Calendar, Heart } from "lucide-react";
import { PortalHeader, ToolSection, type Tool } from "@/components/PortalCard";

export const Route = createFileRoute("/portals/client")({
  head: () => ({
    meta: [
      { title: "Client Portal — Syncora Connect" },
      { name: "description", content: "Client tools: describe your legal needs, match with professionals, manage matters, upload court documents, and review professionals." },
      { property: "og:title", content: "Client Portal — Syncora Connect" },
      { property: "og:description", content: "Everything a client needs in one place: intake, multi-matter tracking, court-doc risk review, calendar, and reviews." },
    ],
  }),
  component: ClientPortal,
});

const INTAKE: Tool[] = [
  { to: "/", label: "Start an intake", desc: "Describe your matter and get matched with vetted professionals across multiple specialties.", icon: Search },
  { to: "/professionals", label: "Browse professionals", desc: "Search the full directory of attorneys, mediators, GALs, and counselors.", icon: FolderOpen },
];
const MATTERS: Tool[] = [
  { to: "/cases", label: "My matters", desc: "Track every legal need you've opened — family, trust, employment, and more.", icon: FolderOpen },
  { to: "/court-docs", label: "Court docs & risk", desc: "Upload orders, motions, and filings; surface deadlines, TROs, and risk flags.", icon: ShieldAlert },
  { to: "/calendar", label: "Calendar", desc: "Hearings, deadlines, and consultation dates pulled from your matters.", icon: Calendar },
];
const FEEDBACK: Tool[] = [
  { to: "/reviews", label: "Leave a review", desc: "Rate professionals you've worked with — feedback drives match quality.", icon: Star },
  { to: "/feedback", label: "Product feedback", desc: "Tell us what's working and what's missing in Syncora Connect.", icon: MessageSquare },
  { to: "/donate", label: "Donate", desc: "Support pro-bono matching for clients who can't afford counsel.", icon: Heart },
  { to: "/connections", label: "My connections", desc: "Professionals you've contacted or been matched with.", icon: FileText },
];

function ClientPortal() {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        eyebrow="Client portal"
        title="Your legal needs, organized"
        blurb="Tools for clients: open an intake, stack multiple matters, upload court documents for risk review, and review the professionals you work with."
      />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ToolSection title="Get started" tools={INTAKE} />
        <ToolSection title="Manage your matters" tools={MATTERS} />
        <ToolSection title="Feedback & community" tools={FEEDBACK} />
      </main>
    </div>
  );
}
