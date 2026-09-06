import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import { GoogleAuth } from 'google-auth-library';

import { db, requireRole, notify, allMemberIds } from './lib/init.js';
import { scoreTender } from './lib/matching.js';
import { GMAIL_SCOPES, oauthClient, saveRefreshToken, authorisedGmail, buildMime } from './lib/gmail.js';

const GMAIL_CLIENT_ID = defineSecret('GMAIL_CLIENT_ID');
const GMAIL_CLIENT_SECRET = defineSecret('GMAIL_CLIENT_SECRET');
const SCRAPER_URL = defineSecret('SCRAPER_URL');
const SCRAPER_TOKEN = defineSecret('SCRAPER_TOKEN');

const REGION = 'europe-west1';

/* ------------------------------------------------------------------ *
 * 1. Scraper control
 * ------------------------------------------------------------------ */

async function callScraper(sources) {
  const url = `${SCRAPER_URL.value()}/scrape`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${SCRAPER_TOKEN.value()}`,
    },
    body: JSON.stringify({ sources: sources ?? null }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Scraper failed [${res.status}]: ${text}`);
  return JSON.parse(text);
}

/** Called by the "Run Scraper" button in the app. */
export const runScraper = onCall(
  { region: REGION, secrets: [SCRAPER_URL, SCRAPER_TOKEN], timeoutSeconds: 540 },
  async (request) => {
    await requireRole(request, ['admin', 'member']);
    const sources = request.data?.sources ?? null;
    const result = await callScraper(sources);
    return result; // { runId, found, new, relevant }
  },
);

/** Optional scheduled run — 06:00 and 18:00 South African time. */
export const scheduledScrape = onSchedule(
  {
    region: REGION,
    schedule: '0 6,18 * * *',
    timeZone: 'Africa/Johannesburg',
    secrets: [SCRAPER_URL, SCRAPER_TOKEN],
    timeoutSeconds: 540,
  },
  async () => { await callScraper(null); },
);

/* ------------------------------------------------------------------ *
 * 2. Matching + notifications on newly scraped tenders
 * ------------------------------------------------------------------ */

export const onTenderCreated = onDocumentCreated(
  { region: REGION, document: 'tenders/{tenderId}' },
  async (event) => {
    const tender = event.data?.data();
    if (!tender) return;

    const profileSnap = await db.collection('company').doc('profile').get();
    const profile = profileSnap.exists ? profileSnap.data() : {};

    const { matchScore, matchReasons } = scoreTender(tender, profile);
    await event.data.ref.update({ matchScore, matchReasons });

    if (matchScore >= (profile.alertThreshold ?? 60)) {
      await notify(await allMemberIds(), {
        type: 'tender',
        title: `New ${matchScore}% match: ${tender.title}`,
        body: `${tender.organisation} · closes ${tender.closingDate ?? 'unknown'}`,
        tenderId: event.params.tenderId,
      });
    }
  },
);

/** Daily 07:00 SAST reminder for tenders closing within 3 days. */
export const deadlineReminders = onSchedule(
  { region: REGION, schedule: '0 7 * * *', timeZone: 'Africa/Johannesburg' },
  async () => {
    const now = new Date();
    const soon = new Date(now.getTime() + 3 * 86400000);
    const snap = await db.collection('tenders')
      .where('closingDate', '>=', now.toISOString())
      .where('closingDate', '<=', soon.toISOString())
      .get();

    if (snap.empty) return;
    const members = await allMemberIds();
    for (const doc of snap.docs) {
      const t = doc.data();
      if (['submitted', 'declined', 'lost', 'won'].includes(t.status)) continue;
      await notify(members, {
        type: 'deadline',
        title: `Closing soon: ${t.title}`,
        body: `${t.organisation} closes ${t.closingDate}`,
        tenderId: doc.id,
      });
    }
  },
);

/* ------------------------------------------------------------------ *
 * 3. Gmail OAuth (send-only)
 * ------------------------------------------------------------------ */

export const gmailAuthUrl = onCall(
  { region: REGION, secrets: [GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET] },
  async (request) => {
    const { uid } = await requireRole(request, ['admin', 'member']);
    const redirectUri = request.data?.redirectUri;
    if (!redirectUri) throw new HttpsError('invalid-argument', 'redirectUri is required.');

    const url = oauthClient(redirectUri).generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GMAIL_SCOPES,
      state: uid,
    });
    return { url };
  },
);

export const gmailExchangeCode = onCall(
  { region: REGION, secrets: [GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET] },
  async (request) => {
    const { uid } = await requireRole(request, ['admin', 'member']);
    const { code, redirectUri } = request.data ?? {};
    if (!code || !redirectUri) throw new HttpsError('invalid-argument', 'code and redirectUri are required.');

    const client = oauthClient(redirectUri);
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
      throw new HttpsError('failed-precondition', 'Google did not return a refresh token. Disconnect the app in your Google account and try again.');
    }
    client.setCredentials(tokens);

    const info = await client.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' })
      .catch(() => ({ data: {} }));
    const address = info.data?.email ?? request.auth.token.email;

    await saveRefreshToken(uid, tokens, address);
    return { connected: true, emailAddress: address };
  },
);

export const gmailDisconnect = onCall({ region: REGION }, async (request) => {
  const { uid } = await requireRole(request, ['admin', 'member']);
  await db.collection('secrets').doc('gmail').collection('tokens').doc(uid).delete();
  await db.collection('users').doc(uid).set({ gmailConnected: false }, { merge: true });
  return { connected: false };
});

/* ------------------------------------------------------------------ *
 * 4. Sending email
 * ------------------------------------------------------------------ */

export const sendEmail = onCall(
  { region: REGION, secrets: [GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET], timeoutSeconds: 120 },
  async (request) => {
    const { uid } = await requireRole(request, ['admin', 'member']);
    const { to, cc, subject, body, tenderId = null, attachments = [] } = request.data ?? {};

    if (!to || !subject || !body) {
      throw new HttpsError('invalid-argument', 'to, subject and body are required.');
    }
    if (attachments.some((p) => typeof p !== 'string' || !/^(company|tenders)\//.test(p))) {
      throw new HttpsError('invalid-argument', 'Attachments must be files from the document vault.');
    }

    const { gmail, from } = await authorisedGmail(uid);
    const raw = await buildMime({ from, to, cc, subject, body, attachments });

    const sent = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

    const record = {
      tenderId,
      threadId: sent.data.threadId ?? null,
      messageId: sent.data.id ?? null,
      from, to, cc: cc ?? null, subject, body,
      attachments,
      direction: 'outbound',
      sentBy: uid,
      sentAt: new Date(),
    };
    const ref = await db.collection('emails').add(record);

    if (tenderId) {
      await db.collection('tenders').doc(tenderId).collection('activity').add({
        type: 'email',
        message: `Email sent: ${subject}`,
        actor: uid,
        createdAt: new Date(),
      });
    }
    return { id: ref.id, threadId: sent.data.threadId };
  },
);

/* ------------------------------------------------------------------ *
 * 5. AI assistant tool endpoint (called by the in-app agent)
 * ------------------------------------------------------------------ */

export const assistantAction = onCall(
  { region: REGION, secrets: [SCRAPER_URL, SCRAPER_TOKEN, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET], timeoutSeconds: 540 },
  async (request) => {
    const { uid } = await requireRole(request, ['admin', 'member']);
    const { action, args = {} } = request.data ?? {};

    switch (action) {
      case 'search_tenders': {
        let q = db.collection('tenders');
        if (args.status) q = q.where('status', '==', args.status);
        if (args.province) q = q.where('province', '==', args.province);
        const snap = await q.orderBy('closingDate').limit(args.limit ?? 20).get();
        return { tenders: snap.docs.map((d) => ({ id: d.id, ...d.data() })) };
      }
      case 'run_scraper':
        return callScraper(args.sources ?? null);
      case 'update_tender_status': {
        if (!args.tenderId || !args.status) throw new HttpsError('invalid-argument', 'tenderId and status required.');
        await db.collection('tenders').doc(args.tenderId).update({ status: args.status });
        await db.collection('tenders').doc(args.tenderId).collection('activity').add({
          type: 'status', message: `Status changed to ${args.status} by assistant`, actor: uid, createdAt: new Date(),
        });
        return { ok: true };
      }
      case 'draft_email': {
        const snap = args.templateId ? await db.collection('templates').doc(args.templateId).get() : null;
        return { subject: args.subject ?? snap?.data()?.subject ?? '', body: args.body ?? snap?.data()?.body ?? '' };
      }
      default:
        throw new HttpsError('invalid-argument', `Unknown action: ${action}`);
    }
  },
);

/* ------------------------------------------------------------------ *
 * 6. Health check
 * ------------------------------------------------------------------ */

export const health = onRequest({ region: REGION }, async (_req, res) => {
  const sources = await db.collection('sources').get();
  res.json({ ok: true, sources: sources.size, time: new Date().toISOString() });
});

// Kept so google-auth-library stays available for future ID-token calls to a
// private Cloud Run service if you switch off the shared-secret header.
export const _googleAuth = GoogleAuth;
