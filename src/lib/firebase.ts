// Firebase web client — lazily initialised only when the VITE_FIREBASE_*
// config values are present. Until the user pastes their Firebase web app
// config, isFirebaseConfigured is false and every page falls back to the
// bundled demo data.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";

const config = {
  apiKey: import.meta.env["VITE_FIREBASE_API_KEY"] as string | undefined,
  authDomain: import.meta.env["VITE_FIREBASE_AUTH_DOMAIN"] as string | undefined,
  projectId: import.meta.env["VITE_FIREBASE_PROJECT_ID"] as string | undefined,
  storageBucket: import.meta.env["VITE_FIREBASE_STORAGE_BUCKET"] as string | undefined,
  messagingSenderId: import.meta.env["VITE_FIREBASE_MESSAGING_SENDER_ID"] as string | undefined,
  appId: import.meta.env["VITE_FIREBASE_APP_ID"] as string | undefined,
};

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;

function getApp(): FirebaseApp {
  // Only called when isFirebaseConfigured is true, so the values are present.
  if (!app) app = getApps().length ? getApps()[0]! : initializeApp(config as Record<string, string>);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(getApp());
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(getApp());
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(getApp());
  return storage;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) functions = getFunctions(getApp(), "europe-west1");
  return functions;
}
