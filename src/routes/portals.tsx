import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Briefcase, Landmark, Megaphone, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/portals")({
  head: () => ({
    meta: [
      { title: "Syncora Connect — One platform for legal coordination" },
      {
        name: "description",
        content:
          "Syncora Connect simplifies legal coordination. Whether you're a client seeking help, a professional managing matters, or an agency tracking cases — everything connects here.",
      },
      { property: "og:title", content: "Syncora Connect — One platform for legal coordination" },
      {
        property: "og:description",
        content:
          "A unified platform for clients, professionals, agencies, and partners to coordinate legal matters, track cases, and collaborate securely.",
      },
    ],
  }),
  component: PortalsPage,
});

type Portal = {
  to: string;
  label: string;
  who: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
};

const PORTALS: Portal[] = [
  {
    to: "/portals/client",
    label: "Client portal",
    who: "I have a legal need",
    desc: "Describe your matter, match with vetted professionals, track multiple matters, upload court docs, and leave reviews.",
    icon: Users,
    accent: "from-primary/15 to-primary/0",
  },
  {
    to: "/portals/professional",
    label: "Professional portal",
    who: "Attorney, mediator, GAL, counselor",
    desc: "Join the directory, validate specialties, run your private-practice workspace, and respond to matched clients.",
    icon: Briefcase,
    accent: "from-accent/15 to-accent/0",
  },
  {
    to: "/portals/agency",
    label: "Government agency portal",
    who: "Solicitor, judge, court staff, agency counsel",
    desc: "Public-sector matter management, motion-fee receipts, court calendar, judge experience records, and risk review.",
    icon: Landmark,
    accent: "from-emerald-500/15 to-emerald-500/0",
  },
  {
    to: "/portals/advertiser",
    label: "Advertiser portal",
    who: "Sponsor, partner, vendor",
    desc: "Place sponsored placements in front of the right audience segments and review delivery analytics.",
    icon: Megaphone,
    accent: "from-amber-500/15 to-amber-500/0",
  },
  {
    to: "/employee",
    label: "Employee portal",
    who: "Syncora staff (password-protected)",
    desc: "Internal dashboard, task queue, audit log, risk review, and admin tools. SoX 404 controls apply.",
    icon: ShieldCheck,
    accent: "from-rose-500/15 to-rose-500/0",
  },
];

function PortalsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Syncora Connect</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Why use Syncora?
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
            One platform that connects every side of legal coordination —
            so clients, professionals, agencies, and partners move forward together.
          </p>
        </div>

        <section className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PORTALS.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.accent} opacity-60`} />
              <div className="relative">
                <span className="inline-flex rounded-2xl bg-background/80 p-3 text-primary ring-1 ring-border">
                  <p.icon className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-xl font-semibold text-card-foreground group-hover:text-primary">
                  {p.label}
                </h2>
                <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{p.who}</p>
                <p className="mt-3 text-sm text-muted-foreground">{p.desc}</p>
                <span className="mt-4 inline-block text-sm font-medium text-primary">
                  Enter portal →
                </span>
              </div>
            </Link>
          ))}
        </section>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Not sure?{" "}
          <Link to="/portals/client" className="text-primary hover:underline">
            Most visitors are clients — start there.
          </Link>
          {" · "}
          <Link to="/pricing" className="text-primary hover:underline">
            See graduated pricing & early-adopter cohorts
          </Link>
        </p>
      </div>
    </div>
  );
}
