import { google } from 'googleapis';
import { db, bucket } from './init.js';

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

export function oauthClient(redirectUri) {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri,
  );
}

export async function saveRefreshToken(uid, tokens, emailAddress) {
  await db.collection('secrets').doc('gmail').collection('tokens').doc(uid).set(
    {
      refreshToken: tokens.refresh_token,
      emailAddress,
      updatedAt: new Date(),
    },
    { merge: true },
  );
  await db.collection('users').doc(uid).set(
    { gmailConnected: true, gmailAddress: emailAddress },
    { merge: true },
  );
}

export async function authorisedGmail(uid) {
  const snap = await db.collection('secrets').doc('gmail').collection('tokens').doc(uid).get();
  if (!snap.exists) throw new Error('Gmail is not connected for this user.');

  const client = oauthClient();
  client.setCredentials({ refresh_token: snap.data().refreshToken });
  return {
    gmail: google.gmail({ version: 'v1', auth: client }),
    from: snap.data().emailAddress,
  };
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Builds an RFC-822 MIME message, with optional Cloud Storage attachments. */
export async function buildMime({ from, to, cc, subject, body, attachments = [], threadHeaders = {} }) {
  const boundary = `tenderos_${Date.now().toString(36)}`;
  const head = [
    `From: ${from}`,
    `To: ${Array.isArray(to) ? to.join(', ') : to}`,
    cc ? `Cc: ${Array.isArray(cc) ? cc.join(', ') : cc}` : null,
    `Subject: ${subject}`,
    threadHeaders.inReplyTo ? `In-Reply-To: ${threadHeaders.inReplyTo}` : null,
    threadHeaders.references ? `References: ${threadHeaders.references}` : null,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean).join('\r\n');

  const parts = [
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    body,
  ];

  for (const path of attachments) {
    const file = bucket().file(path);
    const [contents] = await file.download();
    const [meta] = await file.getMetadata();
    const name = path.split('/').pop();
    parts.push(
      `--${boundary}`,
      `Content-Type: ${meta.contentType ?? 'application/octet-stream'}; name="${name}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${name}"`,
      '',
      contents.toString('base64').replace(/(.{76})/g, '$1\r\n'),
    );
  }

  parts.push(`--${boundary}--`, '');
  return b64url(`${head}\r\n\r\n${parts.join('\r\n')}`);
}
