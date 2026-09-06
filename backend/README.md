# Tender OS — Backend

Two pieces, both cheap and both only running when they need to:

1. **Firebase** — the database (Firestore), file storage, user logins, and a
   small set of Cloud Functions (tender matching, notifications, Gmail sending).
2. **Cloud Run scraper** — a Python service that scrapes South African tender
   sites. It scales to zero, so it costs nothing while idle and only runs when
   the "Run Scraper" button (or a scheduled job) calls it.

No always-on browser. All adapters use plain HTTP + HTML parsing
(`httpx` + `selectolax`). If a site later turns out to require JavaScript, that
single adapter can be swapped to Playwright without touching the rest.

```
backend/
  firebase/          firestore.rules, storage.rules, indexes, firebase.json
  functions/         Cloud Functions (Node 20)
  scraper/           Cloud Run service (Python 3.12, FastAPI)
```

---

## 1. Firestore data model

| Collection | Purpose | Key fields |
|---|---|---|
| `tenders` | Everything the scraper finds | `reference`, `title`, `organisation`, `province`, `category`, `closingDate`, `publishedDate`, `value`, `sourceId`, `sourceUrl`, `documents[]`, `matchScore`, `status`, `hash` |
| `tenders/{id}/requirements` | Checklist per tender | `label`, `met`, `note` |
| `tenders/{id}/activity` | Audit trail | `type`, `message`, `actor`, `createdAt` |
| `sources` | Scraper source registry | `name`, `adapter`, `enabled`, `lastRun`, `lastStatus`, `found` |
| `scraperRuns` | Run history | `startedAt`, `finishedAt`, `status`, `found`, `new`, `relevant`, `errors[]` |
| `company` (single doc `profile`) | Mphela Industries profile | registration, BBBEE, CIDB, CSD, directors, certifications |
| `documents` | Company document vault | `name`, `type`, `storagePath`, `expiresAt`, `verified` |
| `emails` | Sent/received correspondence | `tenderId`, `threadId`, `from`, `to`, `subject`, `body`, `direction`, `sentAt` |
| `templates` | Email templates | `title`, `subject`, `body` |
| `notifications` | In-app alerts | `userId`, `type`, `title`, `body`, `read` |
| `users/{uid}` | Profile + role | `email`, `role` (`admin` / `member` / `viewer`) |
| `secrets/gmail/{uid}` | Gmail OAuth refresh token | **server-only**, no client read |

Dedupe key: `sha256(reference + organisation)` stored as `hash`, used as the
Firestore document id, so re-running the scraper never creates duplicates.

## 2. Deploy Firebase

```bash
cd backend/firebase
firebase login
firebase use --add            # pick your project
firebase deploy --only firestore:rules,firestore:indexes,storage
cd ../functions && npm install
firebase deploy --only functions
```

Function config needed:

```bash
firebase functions:secrets:set GMAIL_CLIENT_ID
firebase functions:secrets:set GMAIL_CLIENT_SECRET
firebase functions:secrets:set SCRAPER_URL        # Cloud Run https URL
firebase functions:secrets:set SCRAPER_TOKEN      # shared secret, any long random string
```

## 3. Deploy the scraper to Cloud Run

```bash
cd backend/scraper
gcloud run deploy tender-scraper \
  --source . \
  --region europe-west1 \
  --memory 1Gi --cpu 1 --timeout 900 \
  --min-instances 0 --max-instances 3 \
  --no-allow-unauthenticated \
  --set-env-vars SCRAPER_TOKEN=<same value as above>
```

`--min-instances 0` is what keeps it free: the container shuts down when the
run finishes and you are only billed for the seconds it was actually scraping.

Optional scheduled run (twice a day):

```bash
gcloud scheduler jobs create http tender-scrape-daily \
  --schedule "0 6,18 * * *" --time-zone "Africa/Johannesburg" \
  --uri "https://<cloud-run-url>/scrape" --http-method POST \
  --headers "Authorization=Bearer <SCRAPER_TOKEN>" \
  --message-body '{"sources":["etenders","eskom","transnet","sanral","prasa"]}'
```

## 4. Gmail sending (OAuth)

1. In Google Cloud Console → APIs & Services → Credentials, create an **OAuth
   client ID** (Web application).
2. Authorised redirect URI: `https://<your-app-domain>/settings/gmail/callback`.
3. Scope used: `https://www.googleapis.com/auth/gmail.send` (send only — the app
   can never read the mailbox).
4. The user clicks "Connect Gmail" in Settings → the app calls the
   `gmailAuthUrl` function → Google consent → the callback posts the code to
   `gmailExchangeCode`, which stores the refresh token in `secrets/gmail/{uid}`
   (locked to server access only).
5. `sendEmail` builds an RFC-822 message (with attachments pulled from Cloud
   Storage) and posts it to the Gmail API.

## 5. Cost expectation

| Piece | Monthly |
|---|---|
| Firestore / Auth / Storage (low volume) | R0 (free tier) |
| Cloud Run, ~60 runs × 3 min | R0–R20 |
| Cloud Scheduler (3 free jobs) | R0 |
| Gmail API | R0 |
