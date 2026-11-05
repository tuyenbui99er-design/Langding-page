# Minimal Clothing — Product Specification

## Outcome
Build a genuine, fast, mobile-only-first Vietnamese product shopping flow inspired by familiar ecommerce product pages. Desktop may display a centered mobile-width layout. Brand identity must remain original.

## Product / commercial defaults
- Store: Minimal Clothing.
- Example product: Quần Ống Suông Cạp Cao Tôn Dáng, Phong Cách Lịch Sự Công Sở.
- Compare-at: 229.000đ; selling price: 159.000đ.
- Colors: Đen / Ghi / Kem / Khói lạ / Be khói / Nâu.
- Sizes: S / M / L / XL / 2XL / 3XL (size recommendations and 40–80 kg range are informational, not a verified per-size mapping).
- Customer shipping fee: 30.000đ for quantity 1; free for quantity >= 2.
- Checkout: COD; buyer name, phone, detailed delivery address, optional notes.
- Other known claims to display **only after verifying evidence**: fabric 'vintex xuất khẩu', 3-day exchange window, 3-month zipper/seam warranty, 68,000+ sales, 4.9/5 rating.
- Real assets: use files supplied by the user; otherwise use clearly marked development placeholders.

## Required screens
1. Product detail: video/gallery, product identity, pricing, variant selection, size chart, quantity, descriptions/policies, sticky mobile CTA.
2. Checkout: customer details, summary, shipping, discount, final total, COD instructions, error and duplicate-submission protection.
3. Order success: real persisted order number, purchased items, quantities, totals, shipping address overview and status.
4. Secure order lookup: verified access to the customer's own order; never expose PII through a public order-number search.
5. Basic protected administration for authorized staff to view/update order fulfillment status (after authentication is designed).

## Business invariants
- Monetary amounts are integers of VND, no floating-point discounts.
- Final total = sum of item unit prices times quantity + shipping - validated discounts (if any).
- Shipping is 0 for >=2 items, otherwise 30,000 VND in the initial single-product promotion. Do not mistakenly use the shop's internal 14,000 VND carrier expense in checkout.
- Server verifies product IDs, selectable variants, unit prices, promotions, and order totals.
- Do not mark a COD order as paid when the customer merely submits an order.
- Distinguish order placement, confirmed order, shipped, delivered, cancelled, returned.
- A successful API response is contingent upon actual storage persistence.

## Quality gates
- Functional in common mobile viewports 320 / 360 / 390 / 430 px.
- Reasonable Core Web Vitals, no horizontal overflow, no inaccessible overlays.
- SEO: HTML content indexable, accurate title/description, canonical, Open Graph, crawlable internal links, valid structured data, sitemap and robots where appropriate.
- Privacy: limit retention/access to personal details; secrets never in repository.
- No fabricated reviews, video demonstrations, orders, or backend confirmations.

## Implementation notes
The repository began empty. Codex should create the appropriate app files when tasked. Default preferred stack: Next.js App Router + TypeScript, Tailwind CSS, a server-side database adapter, and tests. Choose a data store suitable for the actual deployment environment after reviewing available credentials. Document prerequisites in README.md. No live Meta Ads launch or production deployment without approval.
