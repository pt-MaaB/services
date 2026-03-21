# RankRent — Rank & Rent Digital Real Estate

**Model:** Build local service landing pages → rank on Google → rent inbound leads to service providers.
**Target market:** Coimbra, Portugal (expanding to Centro region).
**Domain:** TBD — one root domain + subfolders (e.g., `urgente-coimbra.pt/canalizador/`)

---

## Niche Tracker

| Niche | Folder | Page Status | Ranking | Renter | Monthly Fee | Notes |
|---|---|---|---|---|---|---|
| Canalizador urgente | `niches/canalizador-coimbra/` | Draft | — | — | — | |
| Eletricista urgente | `niches/eletricista-coimbra/` | — | — | — | — | |
| Serralheiro / Chaveiro | `niches/serralheiro-coimbra/` | — | — | — | — | |
| Controlo de pragas | `niches/controlo-pragas-coimbra/` | — | — | — | — | |
| Limpeza de terrenos | `niches/limpeza-terrenos-coimbra/` | — | — | — | — | Seasonal: Jan–Mar peak (DFCI deadline) |

## Revenue Tracker

| Month | Active Pages | Rented Pages | MRR |
|---|---|---|---|
| — | 0 | 0 | €0 |

---

## Lead Tracking Stack (€0)

- **GA4:** Custom events `click_whatsapp` and `click_phone` on every page
- **WhatsApp pre-fill:** Each page uses a unique pre-filled message: `Olá, vim do site [niche-slug]`
- **Google Search Console:** Weekly rank + impressions check
- **Lead log:** `niches/[niche]/tracking.md` — manual log updated by renter monthly

---

## Build Protocol

Follow `workflows/rank_rent_lander.md` for every new niche.

## Tech Stack

- Pure HTML/CSS/JS — no build tooling, deploys anywhere
- Tailwind CDN for utility classes
- GA4 via gtag.js snippet
- JSON-LD schema embedded in `<head>`
- Mobile-first: WhatsApp CTA above fold on 375px

## Revenue Model

- Flat monthly fee per page: €80–€200/mo (adjust by niche urgency + lead volume)
- Limpeza de terrenos: premium seasonal rate Jan–Mar (€150–€300/mo), lower off-season base
- Trial offer for first renter: 30 days free → pitch conversion data → start billing month 2
