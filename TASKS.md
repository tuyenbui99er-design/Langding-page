# Implementation Backlog for Codex

Codex: Read `AGENTS.md` and `GOALS.md`. Implement tasks in priority order, updating progress in `PLANS.md` and checking items only after verification. Each task should include tested acceptance criteria.

## Phase 0 — Establish runnable application [P0]

- [x] Initialize maintainable project with TypeScript, app router, responsive styling, package scripts and README quickstart.
- [x] Create a mobile-first product page shell for 320 / 360 / 390 / 430 px, preserving originality (no TikTok brand duplication).
- [x] Add lint/typecheck/build and automated tests where feasible.

Acceptance: clean install and development server work; project builds; responsive layout does not overflow.

## Phase 1 — Product and pricing [P0]

- [ ] Product video with poster, image gallery, description and size chart. **Partial:** media rendering/policy/size sections implemented; seller size chart is implemented from supplied data; six color photos are visible in chat but original files are not accessible, and supplied MOV exceeds the 32 MiB transfer limit. Approved material/policy evidence is still missing. Placeholders are explicitly labeled; no invented claims.
- [x] Select color, size and quantity; show validation and inventory-status behavior where known.
- [x] Live sale price, compare-at price, item subtotal, shipping and total.
- [x] Automated price tests for 1, 2, 3 units and input edge cases.

Acceptance: 1 × 159.000đ + 30.000đ shipping = 189.000đ. 2 × 159.000đ + 0đ shipping = 318.000đ.

## Phase 2 — Genuine COD orders [P0]

- [x] Secure API endpoint; server-side validation and authoritative pricing.
- [x] Real persistent order schema/storage and unique order references.
- [x] Idempotency, basic abuse controls, failure states.
- [x] Checkout form and real order confirmation.

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

## Verification — 2026-11-05

- Phase 0 and Phase 2 verified locally. Phase 1 pricing/selection verified; real media and measured size chart remain blocked on shop-provided assets/data.
- Clean `npm ci`, dev SSR request, lint, typecheck, 5 unit/API tests, build, 6 Chromium E2E tests passed. Mobile widths: 320/360/390/430 px without horizontal overflow.
- E2E confirms private receipts, server pricing, duplicate retry and lost-response recovery. SQLite persistence verified by close/reopen.
- No production deployment; P1 is intentionally unimplemented. See PLANS.md and README.md for limitations.
