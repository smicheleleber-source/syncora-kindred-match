import { createFileRoute } from "@tanstack/react-router";
import { Landmark, Gavel, ShieldAlert, Calendar, FileText, ScrollText, Scale, Wallet } from "lucide-react";
import { PortalHeader, ToolSection, type Tool } from "@/components/PortalCard";

export const Route = createFileRoute("/portals/agency")({
  head: () => ({
    meta: [
      { title: "Government Agency Portal — Syncora Connect" },
      { name: "description", content: "Public-sector legal tools: solicitor matter management, motion-fee receipts, court calendar, judge experience records, and document risk review." },
      { property: "og:title", content: "Government Agency Portal — Syncora Connect" },
      { property: "og:description", content: "Built for solicitors general, city/county/state solicitors, court staff, and agency counsel." },
    ],
  }),
  component: AgencyPortal,
});

const MATTERS: Tool[] = [
  { to: "/solicitor", label: "Solicitor workspace", desc: "Matters, time log for public reporting, filings, and motion-fee receipts.", icon: Landmark },
  { to: "/trust", label: "Court registry & escrow", desc: "Hold disputed funds in court registry or opposing-counsel escrow with strict no-overdraw rules.", icon: Wallet },
  { to: "/court-docs", label: "Court docs & risk", desc: "Triage orders and filings; surface TROs, deadlines, and risk flags.", icon: ShieldAlert },
  { to: "/calendar", label: "Court calendar", desc: "Hearings, status conferences, and statutory deadlines.", icon: Calendar },
];
const RECORDS: Tool[] = [
  { to: "/judges", label: "Judge directory", desc: "Public roster of jurists with experience records.", icon: Gavel },
  { to: "/admin/judges", label: "Validate judges", desc: "Confirm jurist experience claims for the public record.", icon: Scale },
  { to: "/legislative", label: "Legislative tracker", desc: "Bills and statutes affecting your docket.", icon: ScrollText },
];
const RESOURCES: Tool[] = [
  { to: "/playbooks/litigation", label: "Litigation playbooks", desc: "Procedural playbooks and motion templates.", icon: FileText },
  { to: "/collab", label: "Co-counsel collab", desc: "Coordinate with outside counsel and other agencies.", icon: FileText },
];

function AgencyPortal() {
  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        eyebrow="Government agency portal"
        title="Public-sector legal work"
        blurb="For solicitors general, city/county/state solicitors, court staff, and agency counsel. Manage public matters, record motion fees, validate judges, and review court documents — no client billing."
      />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <ToolSection title="Matters & risk" tools={MATTERS} />
        <ToolSection title="Public records" tools={RECORDS} />
        <ToolSection title="Resources" tools={RESOURCES} />
      </main>
    </div>
  );
}
