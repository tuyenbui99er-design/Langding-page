# Implementation Backlog for Codex

Codex: Read `AGENTS.md` and `GOALS.md`. Implement tasks in priority order, updating progress in `PLANS.md` and checking items only after verification. Each task should include tested acceptance criteria.

## Phase 0 — Establish runnable application [P0]
- [ ] Initialize maintainable project with TypeScript, app router, responsive styling, package scripts and README quickstart.
- [ ] Create a mobile-first product page shell for 320 / 360 / 390 / 430 px, preserving originality (no TikTok brand duplication).
- [ ] Add lint/typecheck/build and automated tests where feasible.

Acceptance: clean install and development server work; project builds; responsive layout does not overflow.

## Phase 1 — Product and pricing [P0]
- [ ] Product video with poster, image gallery, description and size chart.
- [ ] Select color, size and quantity; show validation and inventory-status behavior where known.
- [ ] Live sale price, compare-at price, item subtotal, shipping and total.
- [ ] Automated price tests for 1, 2, 3 units and input edge cases.

Acceptance: 1 × 159.000đ + 30.000đ shipping = 189.000đ. 2 × 159.000đ + 0đ shipping = 318.000đ.

## Phase 2 — Genuine COD orders [P0]
- [ ] Secure API endpoint; server-side validation and authoritative pricing.
- [ ] Real persistent order schema/storage and unique order references.
- [ ] Idempotency, basic abuse controls, failure states.
- [ ] Checkout form and real order confirmation.

Acceptance: newly submitted valid orders can be fetched from actual persistent storage; no simulated success.

## Phase 3 — Order lookup / fulfillment [P1]
- [ ] Secure buyer order lookup with suitable verification.
- [ ] Authorized order management and fulfillment state changes.
- [ ] Test unauthorized access and invalid or duplicate requests.

Acceptance: one customer cannot view another customer's private order by guessing a code.

## Phase 4 — SEO / tracking / performance [P1]
- [ ] HTML metadata, product structured data from verified facts, sitemap, robots, Open Graph.
- [ ] Image/video performance and mobile accessibility verification.
- [ ] Meta Pixel / CAPI integration plan with COD conversion definitions and event de-duplication. Implement only when identifiers and deployment requirements are supplied.

Acceptance: no fabricated marketing data; run audit tooling or document blockers and manual checks.

## Working rule
When asked to 'start' or 'continue', proactively pick the first uncompleted P0 task, implement it, run tests, update docs, and summarize changed files + test results. Only request user input where credentials, production changes, or materially ambiguous business decisions are necessary.
