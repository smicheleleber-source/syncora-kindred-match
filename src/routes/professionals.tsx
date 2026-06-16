import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/professionals")({
  head: () => ({
    meta: [
      { title: "For Professionals and Service Providers — Syncora Connect" },
      {
        name: "description",
        content:
          "How legal and professional service providers use Syncora Connect to get matched with clients, manage cases, and build trust.",
      },
      { property: "og:title", content: "For Professionals and Service Providers — Syncora Connect" },
      {
        property: "og:description",
        content:
          "How legal and professional service providers use Syncora Connect to get matched with clients, manage cases, and build trust.",
      },
    ],
  }),
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border/60 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="mx-auto max-w-5xl px-6 py-12 md:py-16">
          <div className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.2em] text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-accent" />
            Syncora Connect · For Professionals and Service Providers
          </div>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            Grow your practice with better client relationships.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Syncora Connect is a matchmaking and case-management platform that
            pairs clients with the right professional — and gives both sides the
            tools to collaborate transparently from intake through resolution.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/providers/join"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              List your practice →
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              ← Back to client matching
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12 md:py-16">
        {/* What is Syncora Connect */}
        <section className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              What is Syncora Connect?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Syncora Connect is a two-sided marketplace and workflow toolkit built
              for legal, medical, professional-services, self-governance etc
              providers. Clients answer a short intake questionnaire; our scoring
              engine surfaces the top three matches based on specialty, budget,
              urgency, and location. Professionals and Service Providers get pre-qualified leads, not cold
              calls.
            </p>
            <p className="mt-3 text-muted-foreground">
              Beyond matchmaking, Syncora provides shared tools such as — litigation
              playbooks, a systems-engineering matrix for building claims, case-law
              integration, and a donation engine for community alliances — so that
              professionals and/or service providers and clients stay aligned on strategy and evidence.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Core principles
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-foreground">
              <li className="flex gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full bg-primary/10 text-center text-xs font-bold leading-5 text-primary">
                  1
                </span>
                <span>
                  <strong>Transparent scoring.</strong> Clients see why you’re a
                  match. You see why they chose you.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full bg-primary/10 text-center text-xs font-bold leading-5 text-primary">
                  2
                </span>
                <span>
                  <strong>Verified identity.</strong> License numbers and issuing
                  boards are checked at listing time; verified badges increase
                  match rank.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full bg-primary/10 text-center text-xs font-bold leading-5 text-primary">
                  3
                </span>
                <span>
                  <strong>Collaborative tools.</strong> Shared litigation matrices,
                  document libraries, and review dashboards keep both sides on the
                  same page.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full bg-primary/10 text-center text-xs font-bold leading-5 text-primary">
                  4
                </span>
                <span>
                  <strong>Community accountability.</strong> Public reviews and
                  bar-complaint tracking build long-term trust in the network.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* How to use it */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            How professionals and service professional use Syncora Connect
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <StepCard
              number="01"
              title="List your practice"
              description="Create a verified profile with your specialties, budget range, availability, and credentials. The more detail you add, the higher you rank in matching."
              cta={{ label: "Start your listing", to: "/providers/join" }}
            />
            <StepCard
              number="02"
              title="Receive matched inquiries"
              description="Clients answer a structured intake; our engine scores every provider and presents the top three. When you’re a match, the client can request a connection."
              cta={{ label: "See how matching works", to: "/" }}
            />
            <StepCard
              number="03"
              title="Collaborate on the case"
              description="Use the Litigation Matrix to decompose claims into elements, link evidence and case law, and generate draft motions. Clients can follow progress in real time."
              cta={{ label: "Open the matrix", to: "/playbooks/matrix" }}
            />
          </div>
        </section>

        {/* Tools for professionals */}
        <section className="mt-16">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Tools built for your workflow
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ToolCard
              title="Litigation Playbook"
              description="Step-by-step litigation workflows from intake through discovery, motion practice, and trial."
              to="/playbooks/litigation"
            />
            <ToolCard
              title="Litigation Matrix"
              description="Systems-engineering approach: map claims to elements, assign proof strength, attach documents, and cite case law."
              to="/playbooks/matrix"
            />
            <ToolCard
              title="Case Reviews & Funding"
              description="Community members can review and fund cases that need public support or expert testimony."
              to="/cases"
            />
            <ToolCard
              title="Client Reviews"
              description="Verified clients leave ratings, pros/cons, and bar-complaint records that build your reputation."
              to="/reviews"
            />
          </div>
        </section>

        {/* What features are still needed */}
        <section className="mt-16 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            What additional features are needed?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Syncora Connect is actively evolving. Below are the gaps we are
            prioritizing to make the client-to-professional relationship smoother,
            safer, and more productive.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <FeatureBlock
              category="Communication"
              items={[
                "Encrypted, in-app messaging between client and provider (HIPAA / privilege-aware)",
                "Scheduled video consultations with automatic intake pre-fill",
                "Shared calendar for court dates, deadlines, and milestone check-ins",
                "SMS and email reminders for both parties before key events",
              ]}
            />
            <FeatureBlock
              category="Document & Discovery"
              items={[
                "Secure, permissioned document vault with version history",
                "E-signature integration for retainer agreements and affidavits",
                "OCR + full-text search across uploaded pleadings and exhibits",
                "Automatic Bates numbering and exhibit bundling for trial",
              ]}
            />
            <FeatureBlock
              category="Billing & Trust"
              items={[
                "Time tracking and invoice generation linked to matrix tasks",
                "Escrow / trust-account integration for flat-fee or retainer deposits",
                "Milestone-based payment releases with client approval gates",
                "Transparent fee estimator so clients see projected costs upfront",
              ]}
            />
            <FeatureBlock
              category="Trust & Quality"
              items={[
                "Peer-review layer: other professionals can endorse specialties",
                "Outcome tracking: case resolution, satisfaction, and timeline metrics",
                "Conflict-of-interest auto-check against existing client rosters",
                "Continuing-education badge for providers who complete domain training",
              ]}
            />
            <FeatureBlock
              category="Case Intelligence"
              items={[
                "AI-assisted drafting of pleadings tied to matrix elements and citations",
                "Judge / court analytics: win rates, timing, and procedural preferences",
                "Real-time docket monitoring and automatic deadline extraction",
                "Predictive budgeting based on case type, complexity, and venue",
              ]}
            />
            <FeatureBlock
              category="Community & Alliances"
              items={[
                "Multi-provider case teams (co-counsel, experts, investigators)",
                "Alliance fundraising tools with transparent budget and expense reporting",
                "Referral network with split-fee agreements tracked on-platform",
                "Public dashboards for community-defense and mutual-aid campaigns",
              ]}
            />
          </div>

          <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">
            <strong>Want to shape what comes next?</strong>{" "}
            <Link
              to="/providers/join"
              className="font-medium text-primary hover:underline"
            >
              List your practice
            </Link>{" "}
            and you’ll be invited to early previews of the features above.
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Ready to join the network?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Verified professionals get higher match rankings, access to
            collaborative case tools, and visibility in a community that values
            transparency.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/providers/join"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              List your practice →
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-border bg-background px-6 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              Explore the client side
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-border/60 bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Syncora Connect. Built for transparent
          client–professional relationships.
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  cta,
}: {
  number: string;
  title: string;
  description: string;
  cta: { label: string; to: string };
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        Step {number}
      </div>
      <h3 className="mt-2 text-lg font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4">
        <Link
          to={cta.to}
          className="text-sm font-medium text-primary hover:underline"
        >
          {cta.label} →
        </Link>
      </div>
    </div>
  );
}

function ToolCard({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <h3 className="text-base font-semibold text-card-foreground group-hover:text-primary">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <span className="mt-3 inline-block text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
        Open →
      </span>
    </Link>
  );
}

function FeatureBlock({
  category,
  items,
}: {
  category: string;
  items: string[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
        {category}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
