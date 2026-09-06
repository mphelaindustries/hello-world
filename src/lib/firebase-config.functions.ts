// Server function that hands the Firebase web app config to the browser.
// The publishable project values live here as constants; the web API key is
// stored as the GOOGLE_API_KEY secret and is only read on the server.
import { createServerFn } from "@tanstack/react-start";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const getFirebaseConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<FirebaseWebConfig | null> => {
    const apiKey = process.env["GOOGLE_API_KEY"];
    if (!apiKey) return null;
    return {
      apiKey,
      authDomain: "mphelaindustries-d927a.firebaseapp.com",
      projectId: "mphelaindustries-d927a",
      storageBucket: "mphelaindustries-d927a.firebasestorage.app",
      messagingSenderId: "349756408776",
      appId: "1:349756408776:web:109bd24414e792d39af6fd",
    };
  },
);
