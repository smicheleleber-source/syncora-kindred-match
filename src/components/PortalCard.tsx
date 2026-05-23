import { Link } from "@tanstack/react-router";
import type { ComponentType } from "react";

export type Tool = {
  to: string;
  label: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  external?: boolean;
};

export function PortalHeader({
  eyebrow,
  title,
  blurb,
}: {
  eyebrow: string;
  title: string;
  blurb: string;
}) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/portals" className="hover:text-primary">All portals</Link>
          <span>/</span>
          <span className="text-foreground">{eyebrow}</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground">{blurb}</p>
      </div>
    </header>
  );
}

export function ToolGrid({ tools }: { tools: Tool[] }) {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((t) => {
        const inner = (
          <>
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <t.icon className="h-5 w-5" />
              </span>
              <h2 className="text-base font-semibold text-card-foreground">{t.label}</h2>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t.desc}</p>
          </>
        );
        const cls = "group rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm";
        return t.external ? (
          <a key={t.to} href={t.to} className={cls}>{inner}</a>
        ) : (
          <Link key={t.to} to={t.to} className={cls}>{inner}</Link>
        );
      })}
    </section>
  );
}

export function ToolSection({ title, tools }: { title: string; tools: Tool[] }) {
  return (
    <section className="mt-10">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      <ToolGrid tools={tools} />
    </section>
  );
}
