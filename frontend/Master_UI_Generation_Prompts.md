# Master UI Generation Prompts — Payroll Guardian Platform
### Advanced, hackathon-optimized prompts for AI code generation
Run these in order into your AI coding tool (Claude Code, or paste into chat one at a time). Each one builds on the previous.

> ⚠️ Before running any of these: the open questions from your earlier guides (Odoo version, exact RPC field/model names from Jagdeep, Chart.js approval) still need answers. These prompts assume Odoo 17 + OWL 2 syntax — say so explicitly to the AI, or adjust if your version differs, or generated code won't run.

---

## 0. Foundation Prompt — Run This FIRST

This establishes the visual language every other component inherits. Skipping this is the #1 reason hackathon UIs look like "four different people built four different apps."

> "I'm building a payroll compliance dashboard inside Odoo's OWL web client, for a hackathon demo judged on visual polish and perceived production-readiness — not a generic admin template. Design a cohesive visual system and give me a single SCSS file of design tokens (`static/src/scss/design_tokens.scss`) with:
>
> - A restrained, enterprise-fintech palette: a deep near-black or navy base (`#0B0E14`-ish) for dark mode OR a cool off-white (`#F7F8FA`) for light mode — pick one primary mode and make it non-negotiable for the demo rather than building both halfway. Accent color: a single confident blue or teal (not purple/pink — this is a compliance tool, not a consumer app). Severity colors: a muted red (`#E5484D` range), amber (`#F5A623` range), and a calm green/teal for 'ready' — all tuned to pass 4.5:1 contrast against your chosen background, not default Bootstrap red/yellow/green which reads as generic.
> - Typographic scale using a single font stack (system-ui or Inter if available) with deliberate size/weight steps for: page title, section heading, card metric (large tabular numerals for money — use `font-variant-numeric: tabular-nums` so digits don't jitter when numbers update), body text, and micro-labels (uppercase, letter-spaced, small — for the 'CRITICAL/WARNING/INFO' badges).
> - Spacing scale (4/8/12/16/24/32/48px) as CSS custom properties, and a consistent border-radius scale (small for badges, medium for cards, none for tables) — pick radii that read as 'precise fintech tool' not 'rounded consumer app.'
> - Card elevation via a subtle 1px border + very soft shadow, not heavy drop shadows — the aesthetic reference is Stripe's dashboard or Linear's app, not a Material Design card.
> - Define these as CSS custom properties on `:root` (or an OWL-scoped root class) so every component below just references `var(--color-critical)` etc. — never hard-code a hex value in a component file again after this.
>
> Also give me a one-paragraph 'design rationale' comment at the top of the file so I can explain the choice to judges if asked."

---

## 1. Control Center Dashboard — Hero Component

> "Using the design tokens from `design_tokens.scss`, write an OWL 2 component `ControlCenter` that is the landing view of a payroll compliance dashboard. On `willStart`, fetch summary data via ORM (fields: employee_count, total_payroll, readiness_pct, critical_count, warning_count, info_count — I'll wire the real call once the backend contract is confirmed; stub it behind a clearly marked `_fetchSummary()` method for now).
>
> Layout: a top row of four metric cards (Employees, Payroll Total, Readiness %, Risk Level) using CSS grid, each card showing a large tabular-numeral value, a small label above it, and a subtle trend indicator (▲/▼ with % vs last period) if a `previous` value is available — omit the trend arrow gracefully if not, don't show a fake placeholder.
>
> Below that, render the Readiness % not just as a number but as a **radial progress ring** (pure SVG, animate the stroke-dashoffset on mount using a CSS transition, not JS-driven frame-by-frame animation — keep it GPU-cheap) with the percentage in the center and a text status label underneath ('Excellent' / 'Needs Attention' / 'Critical' based on thresholds you define — document the thresholds in a comment).
>
> Below that, a single prominent primary button: '🛡 Run Payroll Guardian' — full-width or centered, using the accent color, with a subtle pulse/glow micro-animation on idle (very subtle, `animation-duration` ≥ 3s, not distracting) to draw the eye as the dashboard's signature call-to-action, since this is the moment judges should remember.
>
> Include: loading skeleton (matching the exact card layout, not a spinner), error state with retry, and re-fetch on a `payroll_guardian_updated` bus event. Semantic HTML: `<section>` per card group with a visually-hidden `<h2>` for screen readers even though the design doesn't show a literal heading. All numbers get an `aria-label` describing the full value in words."

---

## 2. Workforce Status Strip

> "Write an OWL component `WorkforceStatus` as a horizontal strip beneath the Control Center — five compact stat chips (Working / Late / Attendance Issues / Overtime hours / On Leave), each with an icon (use `lucide`-style minimal line icons if a library is available, otherwise simple inline SVG — no emoji in the final production version, emoji are fine only in your own planning docs) plus the count plus a one-word label. On hover/focus, each chip should subtly lift (`transform: translateY(-2px)` + shadow increase, 150ms ease) to signal interactivity even if it's just a link to a filtered employee list. Make the whole strip horizontally scrollable with momentum scrolling on narrower viewports rather than wrapping awkwardly, since this is a secondary strip, not the hero."

---

## 3. Guardian Scan — The Signature 'Wow' Moment

This is your single highest-leverage component for judge reaction. Spend disproportionate care here.

> "Write an OWL component `GuardianScan` that runs when the Control Center's 'Run Payroll Guardian' button is clicked. Sequence:
>
> 1. Button enters a busy state (spinner replaces icon, text changes to 'Scanning...', `aria-busy='true'`, disabled).
> 2. A checklist panel slides/fades in below the button showing five items — Contracts, Attendance, Leave, Salary, Payroll — each starting in a neutral/pending state (dim, small pending dot).
> 3. As the real backend scan progresses (or, if synchronous, staged client-side over the actual RPC round-trip using `requestAnimationFrame`-timed reveals rather than arbitrary `setTimeout` — reveal each item only once you have a real signal it's 'done', or if you must fake pacing while waiting on one RPC call, cap the total fake sequence at under 1.5s so it never outlasts a slow real response and looks broken) — each checklist item transitions pending → checking (subtle spinner) → done (checkmark, color shifts to the ready-green token) with a smooth 200-300ms transition, staggered ~150ms apart for a satisfying cascade rather than all items popping at once.
> 4. On completion, the panel collapses into a results summary: 'N employees scanned — X ready, Y critical, Z warnings' with a count-up number animation (animate the displayed integer from 0 to final value over ~600ms using `requestAnimationFrame`, not CSS, since you're animating a text node) for the scanned-employee count specifically, since a rapidly counting number is a strong 'this feels alive' signal for judges.
> 5. If the real result is zero issues, don't just say '0 issues' flatly — show a small celebratory state (a checkmark icon, 'All clear' in the ready-green color) so a good outcome still feels rewarding, not anticlimactic.
> 6. If the RPC fails, collapse gracefully into an error state with the real error message and a retry button — never leave the checklist stuck mid-animation.
>
> Emit a `payroll_guardian_updated` bus event with the final summary payload when done, so the Control Center and Issue Summary components can react without a manual page refresh."

---

## 4. Explainable Payslip Breakdown

> "Using the same design tokens, write an OWL component `PayslipBreakdown` rendering a payslip as a single vertical receipt-style card (max-width ~480px, centered) — additions (Basic, HRA, Transport, Overtime) listed with a '+' prefix in neutral text, a subtotal 'Gross' row with a top border-top divider, deductions (PF, Tax) with a '−' prefix in a muted red-adjacent tone (not full alarm-red — deductions are normal, not an error), and a final 'Net Pay' row visually the largest and boldest element on the card, using the tabular-numeral large type from the design tokens, so a judge glancing at the screen immediately reads the one number that matters. Use a real semantic `<table>` for the line items (accessibility), but style it to not look like a spreadsheet — no visible grid lines, generous row padding, subtle zebra-free single-hairline row dividers only. Animate the Net Pay number with the same count-up technique as the Guardian scan when it changes after a recalculation, so the 'before → after Fix Now' moment in your demo has real visual payoff."

---

## 5. "Why Did This Change?" Diff Panel

> "Write an OWL component `PayslipExplain`, collapsed by default beneath the payslip card, triggered by a text link/button 'Why did this change?' with a chevron icon that rotates 180° on expand (CSS transition on `transform`, not a swapped icon). When expanded, render a vertical list of deltas comparing current vs previous period, each row: a colored +/− icon (with the same non-color-alone labeling as elsewhere), the line item name, and the delta amount — then a summary sentence at the bottom in slightly larger type: 'Net change: +₹3,620' with the same count-up animation. Use a smooth height-transition expand/collapse (`grid-template-rows: 0fr → 1fr` trick, which animates cleanly unlike `height: auto`) rather than a hard show/hide, since a jarring snap here undercuts the polish of everything else."

---

## 6. Exception Card — Fix Now Interaction

> "Write an OWL component `ExceptionCard` for a single payroll exception. Visual: a card with a left-edge colored bar (4-6px) in the severity color as the primary visual signal, plus a small uppercase severity label chip (never color-only). Body: employee name, exception type, and a financial-impact figure rendered prominently (this number is the emotional hook — 'this will cost ₹2,857 if not fixed' should read as urgent but not alarming). Two actions: a filled primary button 'Fix Now' and a ghost/text-only button 'Ignore', with clear visual hierarchy between them (don't give Ignore equal visual weight — it should look like the secondary, less-recommended path, since your demo narrative is about resolving issues, not dismissing them).
>
> On 'Fix Now' click: button shows an inline spinner replacing its label, card gets a subtle 'processing' treatment (very slight opacity dim + a thin animated progress bar along the top edge), then on success the entire card smoothly collapses/fades out (height + opacity transition, ~300ms) while a small transient toast or inline confirmation ('✓ Resolved — payroll recalculated') appears, then fires the `payroll_guardian_updated` bus event with the new risk delta so the dashboard's radial readiness ring **visually animates from the old % to the new %** in sync — coordinate this exact transition with whoever owns the dashboard component, since a live risk-ring drop from 31% to 12% while a card dissolves is your single best 'wow' beat in the whole demo. On failure, don't dissolve the card — restore it to normal state with an inline error message and let the user retry."

---

## 7. Issue Summary Chips (Dashboard ↔ Exception List Bridge)

> "Write an OWL component `IssueSummary` — three pill-shaped filter chips (Critical / Warning / Info) each showing a count, using `aria-pressed` toggle state, that filter the exception list below by severity. Selected state gets a filled background in the severity color at reduced opacity (10-15%) with a matching colored border and text — not a jarring full-saturation fill, which reads as 'error state' rather than 'active filter.' Unselected chips are outline-only. Clicking 'Critical' when already selected clears the filter back to 'all' — a toggle, not a one-way switch."

---

## 8. QWeb PDF Payslip Report

> "Write a QWeb report template `reports/payslip_report.xml` for `payroll.payslip`, extending `web.external_layout`. Design it to look like an actual professional payslip a real company would issue: company letterhead area, employee details in a clean two-column key-value block (name, ID, department, pay period), then the same breakdown table structure as the on-screen component (use `t-options-widget='monetary'` for all currency, never string concatenation), a clear Net Pay total in a bordered box, and a compliance footer line. Keep the print CSS minimal and high-contrast (this will likely be genuinely printed or screenshotted during judging) — avoid any component that only works in an interactive browser context."

---

## 9. Final Polish Pass — Run This Last, After Everything Works

> "Review these OWL components as a set: `ControlCenter`, `WorkforceStatus`, `GuardianScan`, `PayslipBreakdown`, `PayslipExplain`, `ExceptionCard`, `IssueSummary`. Audit for: (1) consistent spacing using only the design token scale, no stray magic-number pixel values, (2) consistent transition durations/easing across all animated elements (propose one shared `--transition-fast: 150ms ease` and `--transition-smooth: 300ms cubic-bezier(0.4, 0, 0.2, 1)` and apply uniformly), (3) any remaining color-only status signals, (4) any component missing a loading/empty/error state, (5) keyboard-only navigability end to end. List every inconsistency found before fixing anything, so I can review the list first."

---

## 10. Demo-Resilience Pass — Run This Before Rehearsal (Hour ~15-17)

> "Given the full component set, identify every point where a slow or failed network call during a live demo would produce a broken-looking UI (infinite spinner, blank card, console error visible on a projector). For each, propose a specific timeout/fallback (e.g., 'if the Guardian scan RPC hasn't resolved in 4 seconds, show a "still scanning, thanks for your patience" message rather than an indefinite spinner') so the demo degrades gracefully instead of looking broken if venue wifi is bad."

---

## Notes on Using These to Actually Win

- Run **Prompt 0 first, always** — it's what stops the UI from looking like it was built by two people in isolation, which is an instant tell to judges of an uncoordinated team.
- Prompts 1–8 can be split between you and Niharika by ownership (1, 2, 3 are dashboard/Niharika; 4, 5, 6, 8 are payslip/Lucky; 7 bridges both — build it together or agree who owns it, per the earlier ownership gap).
- Prompt 3 (Guardian Scan) and Prompt 6 (Fix Now → risk ring sync) are your two highest-impact "wow" moments — if you run out of time, protect these two over any of the others.
- Don't run prompt 9/10 until the core functional flow actually works — polish before function is how hackathon teams run out of time with a pretty UI that doesn't do anything.
