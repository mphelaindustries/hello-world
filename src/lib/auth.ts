// Firebase Authentication helpers. When Firebase isn't configured the app
// stays in demo mode and every page keeps rendering the bundled sample data.
import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { ensureFirebase, getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export interface AuthState {
  user: User | null;
  loading: boolean;
  /** True when Firebase is not configured — the app runs on demo data. */
  demoMode: boolean;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, loading: true, demoMode: false });

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let active = true;
    void ensureFirebase().then((ok) => {
      if (!active) return;
      if (!ok) {
        setState({ user: null, loading: false, demoMode: true });
        return;
      }
      unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
        setState({ user, loading: false, demoMode: false });
      });
    });
    return () => {
      active = false;
      unsub?.();
    };
  }, []);

  return state;
}

export async function signInWithEmail(email: string, password: string) {
  await ensureFirebase();
  await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  await ensureFirebase();
  const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
}

export async function signInWithGoogle() {
  await ensureFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(getFirebaseAuth(), provider);
}

export async function signOutUser() {
  if (!isFirebaseConfigured) return;
  await signOut(getFirebaseAuth());
}

/** Friendly text for the Firebase auth error codes users actually hit. */
export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "That email address doesn't look right.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "That email already has an account — sign in instead.";
    case "auth/weak-password":
      return "Choose a password with at least 6 characters.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled.";
    case "auth/operation-not-allowed":
      return "That sign-in method isn't switched on for this project yet.";
    default:
      return "Sign-in failed. Please try again.";
  }
}
