import { createFileRoute } from "@tanstack/react-router";
import { UserPlus, Briefcase, BookOpen, Users, MessageSquare, Calendar, FileText, Layers } from "lucide-react";
import { PortalHeader, ToolSection, type Tool } from "@/components/PortalCard";

export const Route = createFileRoute("/portals/professional")({
  head: () => ({
    meta: [
      { title: "Professional Portal — Syncora Connect" },
      { name: "description", content: "Tools for attorneys, mediators, guardians ad litem, and counselors: join the directory, validate specialties, manage matched clients, and run your practice." },
      { property: "og:title", content: "Professional Portal — Syncora Connect" },
      { property: "og:description", content: "Everything a private-practice professional needs: directory listing, specialty validation, client matches, calendar, and playbooks." },
    ],
  }),
  component: ProfessionalPortal,
});

const ONBOARD: Tool[] = [
  { to: "/providers/join", label: "Join the directory", desc: "List your firm, declare specialties (validated later), and start receiving matched clients.", icon: UserPlus },
  { to: "/professionals", label: "Browse peers", desc: "See how your peers describe their practice and specialties.", icon: Users },
];
const PRACTICE: Tool[] = [
  { to: "/solicitor", label: "Practice workspace", desc: "Matter management, time tracking, filings, and analytics for your private practice.", icon: Briefcase },
  { to: "/cases", label: "Matched matters", desc: "Clients matched to you through Syncora intake.", icon: Layers },
  { to: "/calendar", label: "Calendar", desc: "Court dates, depositions, and consultations.", icon: Calendar },
  { to: "/connections", label: "Connections", desc: "Clients and co-counsel you've engaged with.", icon: FileText },
];
const RESOURCES: Tool[] = [
  { to: "/playbooks/litigation", label: "Litigation playbooks", desc: "Reference playbooks by matter type and jurisdiction.", icon: BookOpen },
  { to: "/playbooks/matrix", label: "Strategy matrix", desc: "Decision matrices for common case patterns.", icon: Layers },
  { to: "/collab", label: "Co-counsel collab", desc: "Share filings and notes with co-counsel.", icon: MessageSquare },
];

function ProfessionalPortal() {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        eyebrow="Professional portal"
        title="Run your practice on Syncora"
        blurb="For attorneys, mediators, guardians ad litem, and counselors. Join the directory, validate your specialties, manage matched matters, and tap into shared playbooks."
      />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ToolSection title="Get listed" tools={ONBOARD} />
        <ToolSection title="Your practice" tools={PRACTICE} />
        <ToolSection title="Resources & collaboration" tools={RESOURCES} />
      </main>
    </div>
  );
}
