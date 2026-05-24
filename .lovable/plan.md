## Goal

When a lawyer has no paralegal, make the client benefits visible: **direct knowledge-transfer of availability** and a **flat % reduced rate**. Surface this in two places: each lawyer's profile and the Client portal.

## Changes

### 1. Provider data model (`src/lib/providers.ts`)
Add two optional fields to the `Provider` type for lawyers:
- `has_paralegal: boolean` (default false)
- When `has_paralegal === false`, the profile auto-displays a fixed benefit pair:
  - "Direct availability — you coordinate scheduling with the lawyer, not a gatekeeper."
  - "15% reduced hourly rate — no paralegal overhead."

No per-lawyer rate configuration (per user choice: flat % discount, hard-coded constant `SOLO_LAWYER_DISCOUNT_PCT = 15`).

Seed a couple of existing legal providers with `has_paralegal: false` so the badge shows up immediately.

### 2. Provider profile page (`src/routes/providers.$id.tsx`)
- When `has_paralegal === false` and category is Legal, render a **"Solo practitioner — what you get"** card near the top of the profile:
  - Badge: "No paralegal"
  - Two bullets (availability + reduced rate)
  - Subtle "−15%" chip next to the displayed rate

### 3. Client portal (`src/routes/portals/client.tsx`)
- Add a small explainer section: **"Matched with a solo lawyer? Here's what you get."**
  - Two-column block: Availability / Reduced rate
  - Link "See solo lawyers" → filtered list on `/professionals` (or `/providers/join`-adjacent listing) via a query param `?solo=1`.

### 4. Professionals listing (`src/routes/professionals.tsx`)
- Honor `?solo=1` query param: filter to providers with `has_paralegal === false`.
- Add a small "No paralegal" badge on each card where applicable.

### 5. Shared component
- New `src/components/SoloLawyerBenefits.tsx` — reusable card used by both the profile page and the client portal so copy stays in one place.

## Out of scope
- No database schema changes (provider data lives in `src/lib/providers.ts` in-memory store).
- No editable per-lawyer discount %, no rate breakdown UI beyond the chip.
- No new client intake fields.
