import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Scale, Stethoscope, Home as HomeIcon, Briefcase, Users, Landmark, Lightbulb } from "lucide-react";

type ServiceKey = "legal" | "health" | "home" | "finance";

const SERVICES: Record<ServiceKey, {
  name: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  legal:   { name: "Syncora Legal",   tagline: "Find the right lawyer, right now.",                 icon: Scale },
  health:  { name: "Syncora Health",  tagline: "Connect with a qualified doctor or specialist.",    icon: Stethoscope },
  home:    { name: "Syncora Home",    tagline: "Match with trusted pros for repairs & improvement.", icon: HomeIcon },
  finance: { name: "Syncora Finance", tagline: "Connect with financial advisors, CPAs, planners.",  icon: Briefcase },
};

type RoleOption = {
  key: string;
  label: string;
  who: string;
  desc: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

function rolesFor(service: ServiceKey): RoleOption[] {
  const clientDest =
    service === "legal" ? "/portals/client" : "/";
  const proDest =
    service === "legal" ? "/portals/professional" : "/providers/join";
  return [
    {
      key: "client",
      label: "I'm a client",
      who: "I need help",
      desc: "Describe your need and get matched with vetted professionals.",
      to: clientDest,
      icon: Users,
    },
    {
      key: "professional",
      label: "I'm an attorney",
      who: "I provide legal services",
      desc: "Join the directory, set your specialties, and receive matched clients.",
      to: proDest,
      icon: Scale,
    },
    {
      key: "agency",
      label: "I'm a government official",
      who: "Public-sector / court",
      desc: "Agency workspace: matter management, receipts, calendars, risk review.",
      to: "/portals/agency",
      icon: Landmark,
    },
    {
      key: "advisor",
      label: "I'm an advisor",
      who: "Financial advisor, CPA, consultant",
      desc: "Refer clients to vetted attorneys and collaborate on shared matters.",
      to: "/portals/advisor",
      icon: Lightbulb,
    },
  ];
}

export const Route = createFileRoute("/services/$service")({
  beforeLoad: ({ params }) => {
    if (!(params.service in SERVICES)) throw notFound();
  },
  head: ({ params }) => {
    const s = SERVICES[params.service as ServiceKey];
    const title = s ? `${s.name} — Choose your role` : "Service — Syncora Connect";
    const desc = s ? `${s.tagline} Pick your role to enter the right workspace.` : "Syncora Connect service";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
      ],
    };
  },
  component: ServiceRolePicker,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Service not found</h1>
        <Link to="/" className="mt-3 inline-block text-primary hover:underline">Go home</Link>
      </div>
    </div>
  ),
});

function ServiceRolePicker() {
  const { service } = Route.useParams();
  const key = service as ServiceKey;
  const s = SERVICES[key];
  const Icon = s.icon;
  const roles = rolesFor(key);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-foreground">{s.name}</span>
        </div>

        <div className="mt-6 flex items-start gap-4">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow">
            <Icon className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{s.name}</h1>
            <p className="mt-1 text-muted-foreground">{s.tagline}</p>
          </div>
        </div>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Are you a client or a professional?
        </h2>

        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          {roles.map((r) => (
            <Link
              key={r.key}
              to={r.to}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <r.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-base font-semibold text-card-foreground group-hover:text-primary">{r.label}</div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">{r.who}</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{r.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-primary">Continue →</span>
            </Link>
          ))}
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Looking for the staff area? <Link to="/employee" className="text-primary hover:underline">Employee portal</Link>
        </p>
      </div>
    </div>
  );
}