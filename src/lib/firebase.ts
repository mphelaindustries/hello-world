// Firebase web client — initialised asynchronously from the config served by
// getFirebaseConfig (the web API key lives in the GOOGLE_API_KEY secret).
// Call ensureFirebase() once before the app renders (the _app route loader
// does this). Until it resolves true, isFirebaseConfigured is false and every
// page falls back to the bundled demo data.
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFunctions, type Functions } from "firebase/functions";
import { getFirebaseConfig } from "@/lib/firebase-config.functions";

// Live binding: flips to true once ensureFirebase() succeeds. The route
// loader awaits ensureFirebase() before pages render, so components always
// read the settled value.
export let isFirebaseConfigured = false;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;
let functions: Functions | undefined;
let initPromise: Promise<boolean> | undefined;

export function ensureFirebase(): Promise<boolean> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const config = await getFirebaseConfig();
        if (!config?.apiKey || !config.projectId || !config.appId) return false;
        app = getApps().length ? getApps()[0]! : initializeApp(config);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        functions = getFunctions(app, "europe-west1");
        isFirebaseConfigured = true;
        return true;
      } catch {
        return false;
      }
    })();
  }
  return initPromise;
}

function requireApp(): FirebaseApp {
  if (!app) throw new Error("Firebase is not initialised — call ensureFirebase() first.");
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!auth) auth = getAuth(requireApp());
  return auth;
}

export function getDb(): Firestore {
  if (!db) db = getFirestore(requireApp());
  return db;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) storage = getStorage(requireApp());
  return storage;
}

export function getFirebaseFunctions(): Functions {
  if (!functions) functions = getFunctions(requireApp(), "europe-west1");
  return functions;
}
