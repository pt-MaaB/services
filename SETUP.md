# RankRent — Setup Checklist

The article-generation pipeline runs without any extra setup. The **analytics + self-correction loop** requires 5 one-time clicks in Google's UIs.

GCP project that hosts the service account: **`338980971780`** (Matflow's `claude@project-94249acb-76a5-4a83-84f.iam.gserviceaccount.com`).

## 1. Enable the two Google APIs on the GCP project

- Search Console API: <https://console.developers.google.com/apis/api/searchconsole.googleapis.com/overview?project=338980971780> → click **Enable**.
- Analytics Data API: <https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview?project=338980971780> → click **Enable**.

Propagation takes ~1-5 minutes after enabling.

## 2. Grant the service account access to the data

- **Search Console** → <https://search.google.com/search-console> → select **coimbraservicos.pt** → Settings → Users and permissions → Add user
  - Email: `claude@project-94249acb-76a5-4a83-84f.iam.gserviceaccount.com`
  - Permission: **Restricted**
- **GA4** → <https://analytics.google.com> → Admin (gear icon) → Property column → **Property Access Management** → `+` (top-right) → Add users
  - Email: same as above
  - Role: **Viewer**

## 3. Find the GA4 Property ID

GA4 → Admin → Property Settings → top of the page, look for the numeric **"PROPERTY ID"** (e.g. `456789012`). Add to `/Users/mauroabrantes/Desktop/ANTI/.env`:

```
GA4_PROPERTY_ID=456789012
```

(Don't confuse with the Measurement ID `G-3DJBV60SYQ` which is already wired.)

## 4. Verify

```bash
cd /Users/mauroabrantes/Desktop/ANTI/tools/rankrent
python3 gsc_pull.py --dry-run --days 7
python3 ga4_pull.py --dry-run --days 7
```

Both should print non-zero row counts. If you see `accessNotConfigured`, the API isn't enabled yet (step 1). If you see `PERMISSION_DENIED`, the property grant didn't take (step 2).

## 5. Load the LaunchAgents

```bash
launchctl load -w ~/Library/LaunchAgents/pt.coimbraservicos.daily.plist
launchctl load -w ~/Library/LaunchAgents/pt.coimbraservicos.metrics.plist
launchctl load -w ~/Library/LaunchAgents/pt.coimbraservicos.weekly.plist
launchctl list | grep coimbraservicos
```

## 6. Rotate the Telegram bot token

The current token is hardcoded in `js/lead-capture.js` and pushed to the public repo `pt-maab/services`. Replace it via @BotFather → /mybots → Revoke token. Then the new token goes into the Google Apps Script web app (the Sheets endpoint), and `lead-capture.js` no longer needs it on the client side.

## Files

| File | Purpose |
|---|---|
| `tools/rankrent/_common.py` | Shared config, niche registry, helpers |
| `tools/rankrent/topic_planner.py` | Picks niche+topic, respects 60d recycle |
| `tools/rankrent/generate_article.py` | Gemini → HTML article |
| `tools/rankrent/publish_article.py` | Install to blog/, update sitemap, git push |
| `tools/rankrent/gsc_pull.py` | GSC → `.state/gsc_daily.jsonl` |
| `tools/rankrent/ga4_pull.py` | GA4 → `.state/ga4_daily.jsonl` |
| `tools/rankrent/weekly_analyzer.py` | 6 signal patterns → staged correction report |
| `tools/rankrent/refresh_article.py` | Regen one underperformer |
| `tools/rankrent/daily.py` | Orchestrator: plan + generate + publish |
| `tools/rankrent/bootstrap_topic_bank.py` | Seed 12 topics/niche via Gemini |
| `~/Library/LaunchAgents/pt.coimbraservicos.daily.plist` | Mon-Fri 07:00 trigger |
| `~/Library/LaunchAgents/pt.coimbraservicos.metrics.plist` | Daily 23:00 metrics pull |
| `~/Library/LaunchAgents/pt.coimbraservicos.weekly.plist` | Sun 22:00 analyzer |
| `workflows/rankrent_daily_content.md` | SOP for daily content |
| `workflows/rankrent_weekly_analysis.md` | SOP for weekly analyzer |
