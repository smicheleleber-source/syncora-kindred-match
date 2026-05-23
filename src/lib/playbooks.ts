export type RoleTask = {
  client: string[];
  professional: string[];
};

export type PlaybookPhase = {
  id: string;
  name: string;
  goal: string;
  typical_duration: string;
  tasks: RoleTask;
  deliverables: string[];
  red_flags: string[];
};

export type Playbook = {
  id: string;
  domain: string;
  title: string;
  summary: string;
  phases: PlaybookPhase[];
};

export const LITIGATION_PLAYBOOK: Playbook = {
  id: "civil-litigation",
  domain: "Legal Services",
  title: "Systematic Civil Litigation Playbook",
  summary:
    "A phase-by-phase roadmap both clients and attorneys can use to align on scope, deadlines, and deliverables across the life of a civil case.",
  phases: [
    {
      id: "intake",
      name: "1. Intake & Case Assessment",
      goal: "Confirm a viable claim, conflicts, jurisdiction, and engagement scope.",
      typical_duration: "1–2 weeks",
      tasks: {
        client: [
          "Write a single-page timeline of what happened, with dates.",
          "Gather contracts, emails, texts, photos, receipts — anything related.",
          "List every person involved and how to reach them.",
          "State your goal: money, injunction, custody, settlement, vindication.",
        ],
        professional: [
          "Run conflicts check across all named parties.",
          "Assess statute of limitations and jurisdiction/venue.",
          "Issue a litigation hold letter to the client.",
          "Provide a signed engagement letter with fee structure and scope.",
        ],
      },
      deliverables: ["Engagement letter", "Litigation hold notice", "Case theory memo"],
      red_flags: ["Statute about to expire", "Undisclosed prior counsel", "Spoliation risk"],
    },
    {
      id: "pre-suit",
      name: "2. Pre-Suit Investigation & Demand",
      goal: "Develop facts, preserve evidence, and attempt resolution before filing.",
      typical_duration: "2–6 weeks",
      tasks: {
        client: [
          "Identify and preserve all electronic evidence (no deletions).",
          "Approve budget for investigators or expert consultations if needed.",
          "Decide tolerance for early settlement vs. filing publicly.",
        ],
        professional: [
          "Send demand letter with specific relief sought and deadline.",
          "Interview witnesses and lock down statements.",
          "Engage experts for liability and damages opinions.",
          "Draft complaint in parallel so filing is ready if demand fails.",
        ],
      },
      deliverables: ["Demand letter", "Evidence preservation log", "Draft complaint"],
      red_flags: ["Opposing party going dark", "Asset dissipation", "Adverse witness departing"],
    },
    {
      id: "pleadings",
      name: "3. Pleadings & Initial Motions",
      goal: "Frame the legal claims and survive early dispositive challenges.",
      typical_duration: "1–3 months",
      tasks: {
        client: [
          "Verify factual allegations in the complaint before filing.",
          "Approve forum and parties to be named.",
          "Be available for service-of-process logistics.",
        ],
        professional: [
          "File complaint and effect service on all defendants.",
          "Respond to or file motions to dismiss / for judgment on pleadings.",
          "Calendar all deadlines under local rules and scheduling order.",
        ],
      },
      deliverables: ["Filed complaint", "Proof of service", "Answer or Rule 12 motion"],
      red_flags: ["Missed service window", "Forum non conveniens risk", "Counterclaims filed"],
    },
    {
      id: "discovery",
      name: "4. Discovery",
      goal: "Obtain the evidence needed to prove the case and pin down the other side.",
      typical_duration: "3–9 months",
      tasks: {
        client: [
          "Collect and produce responsive documents promptly.",
          "Prepare for deposition — review timeline and key documents.",
          "Flag any privileged or sensitive material immediately.",
        ],
        professional: [
          "Serve interrogatories, document requests, and RFAs.",
          "Take and defend depositions of parties and key witnesses.",
          "Manage e-discovery vendor, privilege log, and ESI protocol.",
          "Disclose experts and exchange reports per scheduling order.",
        ],
      },
      deliverables: ["Document productions", "Deposition transcripts", "Expert reports"],
      red_flags: ["Missing custodians", "Privilege challenges", "Discovery sanctions"],
    },
    {
      id: "motions",
      name: "5. Dispositive Motions & Mediation",
      goal: "Narrow the case via summary judgment and explore resolution.",
      typical_duration: "2–4 months",
      tasks: {
        client: [
          "Review settlement authority range with counsel honestly.",
          "Attend mediation prepared to decide same day.",
          "Understand risk-adjusted value vs. cost of trial.",
        ],
        professional: [
          "File / oppose motions for summary judgment with full record.",
          "Prepare a mediation brief and damages model.",
          "Coordinate Daubert challenges to opposing experts.",
        ],
      },
      deliverables: ["MSJ briefing", "Mediation statement", "Settlement term sheet (if reached)"],
      red_flags: ["Bad-faith negotiation", "New evidence at the eleventh hour"],
    },
    {
      id: "trial-prep",
      name: "6. Trial Preparation",
      goal: "Build the trial story, exhibits, and witness order for the factfinder.",
      typical_duration: "1–3 months",
      tasks: {
        client: [
          "Block calendar for the full trial window plus prep sessions.",
          "Participate in mock cross-examination.",
          "Approve final exhibit list and demonstratives.",
        ],
        professional: [
          "File motions in limine and pretrial disclosures.",
          "Prepare witness outlines, exhibit binders, and jury instructions.",
          "Run mock trial or focus group if budget allows.",
        ],
      },
      deliverables: ["Pretrial order", "Exhibit list", "Jury instructions", "Trial binder"],
      red_flags: ["Witness unavailability", "Late exhibit objections"],
    },
    {
      id: "trial",
      name: "7. Trial",
      goal: "Present the case clearly and preserve the record for appeal.",
      typical_duration: "1–4 weeks",
      tasks: {
        client: [
          "Attend every day; defer media and social commentary to counsel.",
          "Stay reachable for real-time strategy calls during breaks.",
        ],
        professional: [
          "Deliver opening, direct, cross, and closing on the case theory.",
          "Make and preserve objections cleanly for appellate record.",
          "Submit proposed verdict forms and post-trial briefing.",
        ],
      },
      deliverables: ["Verdict / judgment", "Trial transcript", "Preserved record"],
      red_flags: ["Juror misconduct", "Evidentiary surprises"],
    },
    {
      id: "post-trial",
      name: "8. Post-Trial, Collection & Appeal",
      goal: "Convert the judgment into recovery — or perfect an appeal.",
      typical_duration: "3–18 months",
      tasks: {
        client: [
          "Decide whether to appeal, settle post-verdict, or enforce.",
          "Provide information for asset discovery if collecting.",
        ],
        professional: [
          "File post-trial motions (JMOL, new trial, fees, costs).",
          "Docket notice of appeal within jurisdictional deadline.",
          "Pursue judgment enforcement: liens, garnishment, supplemental discovery.",
        ],
      },
      deliverables: ["Post-trial motions", "Notice of appeal", "Satisfaction of judgment"],
      red_flags: ["Missed appeal deadline", "Judgment-proof defendant"],
    },
  ],
};

export const PLAYBOOKS: Playbook[] = [LITIGATION_PLAYBOOK];