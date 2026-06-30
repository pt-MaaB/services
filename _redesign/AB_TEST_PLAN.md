# RankRent landing-page redesign + A/B test plan

> Built from the verified CRO research (`wiki/research/2026-06-26_high-converting-landing-pages.md`).
> Scope: the live Coimbra rank-and-rent niche landers. Goal: lift the CTA-click rate
> (WhatsApp / phone) — the proxy for rentable leads.
> Status: **proposal — non-destructive.** Artifacts live in `projects/RankRent/_redesign/`,
> nothing live is overwritten until you promote it.

---

## 1. What the research actually changes here

The live pages are already good (dark hero, big H1, sticky mobile CTA, GA4 events). Three evidence-backed changes, in priority order:

| # | Change | Why (verified finding) |
|---|---|---|
| **A** | **Concern-framed CTA copy** instead of a bare phone number / generic verb | Button *copy* beats button *color*; the only large clean case is +68% from naming the user's gating concern. The live eletricista CTA is literally `+351 911 937 182` — a number, not a reason to act. |
| **B** | **Fold-fit the hero on mobile** — shorter H1 so headline + sub + primary CTA + one trust cue all clear ~600px on a 390px phone | ~57% of attention is above the fold and it's a steep top gradient; the CTA must be *in* the first screen, not pushed under a 7xl H1. |
| **C** | **Channel test: phone vs WhatsApp** as the primary emergency CTA | The rank_rent playbook says emergency = WhatsApp primary; the live pages are phone-only. Unresolved — so test it, don't guess. |

Everything below the fold (trust bullets → how-it-works → SEO block → FAQ → repeat CTA) already follows the "earn the scroll" sequence and stays. We repeat the CTA at each decision point (already done).

---

## 2. The harness (`_redesign/ab-test.js`)

Zero-dependency, no build step, no server. Drop-in for static pages.

- Loaded **synchronously in `<head>`, right after the gtag stub**. Assigns a sticky variant (localStorage), writes `<html data-ab-{exp}="{variant}">`, injects CSS that hides the non-active variant. **No flash** — variant content is plain HTML, CSS shows only the active block.
- **Auto-tags every GA4 event** (`click_phone`, `click_whatsapp`, `generate_lead`) with `ab_{exp}={variant}` by wrapping `gtag`. No per-button edits.
- Fires one `experiment_impression` per experiment per session = the denominator for conversion rate.
- Exposes `window.AB.variants()`.

### Wiring a page (two steps)
```html
<!-- in <head>, AFTER the gtag config block -->
<script src="/_redesign/ab-test.js"></script>
```
```html
<!-- author BOTH variants inline; CSS shows the active one -->
<a href="tel:+351911937182" data-ab-when="cta_copy:control" ...>+351 911 937 182</a>
<a href="tel:+351911937182" data-ab-when="cta_copy:concern" ...>Ligar agora — técnico em 45 min</a>
```
Turn tests on/off in the `EXPERIMENTS` map at the top of `ab-test.js` (`active: true`).

### Optional: attribute leads in the Sheet/Telegram (one line in `js/lead-capture.js`)
In `buildClickLead()`, add the variants so the renter's lead log shows which variant produced the lead:
```js
return Object.assign({ /* …existing fields… */ }, (window.AB ? window.AB.variants() : {}));
```

---

## 3. Measurement model

| Metric | Definition | Role |
|---|---|---|
| **CTA-click rate** | (`click_phone` + `click_whatsapp` unique sessions) / `experiment_impression` sessions, per variant | **Primary KPI** — closest leading indicator of a rentable lead |
| Leads logged | Apps Script → Sheet/Telegram rows, per variant | Secondary (truth, but lower volume + lag) |
| Scroll / FAQ opens | optional GA4 events | Diagnostic only |

Read it in GA4: register `ab_cta_copy`, `ab_channel`, `exp_id`, `variant` as **custom dimensions**, then an Exploration: rows = `ab_cta_copy`, values = `experiment_impression` count and `click_phone`+`click_whatsapp` count → click-rate per variant.

---

## 4. The honest part: traffic vs detectable effect

A/B testing a *single* local niche page is usually **underpowered**. The math (two-proportion test, 80% power, 95% confidence, n per variant ≈ 7.84·[p₁(1−p₁)+p₂(1−p₂)] / (p₂−p₁)²):

| Baseline click-rate | Target | Relative lift | Sessions **per variant** | Total |
|---|---|---|---|---|
| 10% | 13% | +30% | ~1,770 | ~3,540 |
| 10% | 17% | **+70%** (gym-sized) | ~370 | ~740 |
| 8% | 14% | +75% | ~310 | ~620 |

**Implications — design the program around this, don't fight it:**

1. **Only test big swings.** Bare-number → concern-framed CTA is a *big* copy change (gym-sized effects are plausible). Don't waste traffic on micro-tweaks (button shade, one word) — the research says those mostly don't move the needle anyway.
2. **Pool by archetype, not per page.** Run the *same* concern-framing test across **all three emergency niches at once** (eletricista + canalizador + serralheiro share the "speed/now" concern) and combine impressions+clicks. Three pages reach ~740 sessions far faster than one. Same for the quote-scheduled cluster.
3. **One high-interaction test per page at a time.** `cta_copy` and `channel` both touch the button — run `cta_copy` first to a decision, then `channel`. (The harness lets you stack them, but interaction noise on low traffic isn't worth it.)
4. **Decision rule:** call it when the pooled archetype reaches the per-variant N for a +70% MDE *or* 6 weeks elapse, whichever first. If inconclusive at 6 weeks, **ship the concern-framed variant anyway** — it's theory-backed and the downside is bounded. Keep the winner as the new control.

---

## 5. Prioritized experiment backlog

Ranked by expected leverage × confidence from the research:

| Pri | Experiment | Variants | Hypothesis (finding) | Run on |
|---|---|---|---|---|
| **1** | `cta_copy` | control (bare number/generic) vs **concern-framed** | Naming the concern lifts clicks (the +68% finding) | All niches, **pooled by archetype** |
| **2** | `hero` fold-fit | long (current 7xl H1) vs **short fold-safe H1** | Getting the CTA above the ~600px mobile fold lifts clicks (57%/top-gradient) | Emergency niches first (biggest H1s) |
| **3** | `channel` | phone vs **whatsapp** primary | Private/async channel may lower friction for pragas; voice may win for true emergencies | pragas (whatsapp-lean) + one emergency (phone-lean) |
| 4 | `proof` | decorative ★★★★★ vs **defensible operational proof** (24h · response time · coverage · certification) | Real, specific proof > empty stars; **never** fabricate review counts | All |

**Guardrail on #4:** these are rank-and-rent pages — the service is real but you do not control a verified review corpus. Do **not** A/B in invented "340 avaliações / testemunhos". Test *operationally true* proof only (availability, response-time promise, coverage zone, DGEG/ICNF/DGS certifications). Fabricated proof is both a conversion risk and a legal one.

---

## 6. Rollout sequence

1. Land `_redesign/ab-test.js` + the redesigned reference page (`_redesign/eletricista.html`) — **review, don't ship yet**.
2. Render-check the reference at 390px (mobile fold) and 1280px.
3. Promote the reference over `eletricista/index.html`; roll the same hero pattern + concern-framed CTAs to the other niches using the matrix (`NICHE_REDESIGN_MATRIX.md`).
4. Enable `cta_copy` (active:true) across an archetype cluster; register GA4 custom dimensions.
5. Read weekly; decide per §4; promote winner to control; advance to experiment #2.

---

*Source of truth for the copy per niche: `_redesign/NICHE_REDESIGN_MATRIX.md`.*
*Research basis: `wiki/research/2026-06-26_high-converting-landing-pages.md`.*
