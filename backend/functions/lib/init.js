import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { HttpsError } from 'firebase-functions/v2/https';

if (getApps().length === 0) initializeApp();

export const db = getFirestore();
export const bucket = () => getStorage().bucket();

/** Throws unless the caller is signed in and has one of the given roles. */
export async function requireRole(request, roles = ['admin', 'member']) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');

  const snap = await db.collection('users').doc(uid).get();
  const role = snap.exists ? snap.data().role : null;
  if (!roles.includes(role)) {
    throw new HttpsError('permission-denied', 'You do not have access to this action.');
  }
  return { uid, role, user: snap.data() };
}

export async function notify(userIds, { type, title, body, tenderId = null }) {
  const batch = db.batch();
  for (const userId of userIds) {
    const ref = db.collection('notifications').doc();
    batch.set(ref, {
      userId, type, title, body, tenderId,
      read: false,
      createdAt: new Date(),
    });
  }
  await batch.commit();
}

export async function allMemberIds() {
  const snap = await db.collection('users').where('role', 'in', ['admin', 'member']).get();
  return snap.docs.map((d) => d.id);
}
