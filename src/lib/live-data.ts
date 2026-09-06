// Live data layer. Every getter reads from Firestore when Firebase is
// configured and falls back to the bundled demo data when it isn't (or when
// the read fails). Pages keep their existing mock-shaped props either way.
import {
  collection, doc, getDoc, getDocs, orderBy, query, limit, updateDoc, where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { getDb, getFirebaseFunctions, isFirebaseConfigured } from "@/lib/firebase";
import {
  tenders as mockTenders, companyDocuments as mockDocuments, company as mockCompany,
  directors as mockDirectors, certifications as mockCertifications,
  experience as mockExperience, emailThreads as mockEmailThreads,
  emailTemplates as mockEmailTemplates, scraperSources as mockScraperSources,
  scraperRuns as mockScraperRuns, notifications as mockNotifications,
  type Tender, type TenderStatus, type CompanyDocument, type Requirement,
} from "@/data/mock";

export { isFirebaseConfigured };

type F = Record<string, unknown>;

const asDate = (v: unknown): string => {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (typeof v === "object" && v !== null && "toDate" in v) {
    return (v as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
  }
  return "";
};

const asMoney = (v: unknown): string => {
  if (typeof v === "string") return v;
  if (typeof v === "number" && v > 0) return `R ${v.toLocaleString("en-ZA").replace(/,/g, " ")}`;
  return "—";
};

const relTime = (v: unknown): string => {
  const iso = asDate(v);
  if (!iso) return "—";
  const days = Math.round((Date.now() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
};

// ---------- mappers (Firestore schema -> UI shape) ----------

function mapTender(id: string, d: F): Tender {
  return {
    id,
    name: (d["title"] as string) ?? (d["name"] as string) ?? "Untitled tender",
    reference: (d["reference"] as string) ?? "—",
    organisation: (d["organisation"] as string) ?? "—",
    category: (d["category"] as string) ?? "General",
    location: (d["province"] as string) ?? (d["location"] as string) ?? "—",
    closingDate: asDate(d["closingDate"]),
    publishedDate: asDate(d["publishedDate"]),
    status: ((d["status"] as string) ?? "NEW") as TenderStatus,
    match: (d["matchScore"] as number) ?? (d["match"] as number) ?? 0,
    value: asMoney(d["value"]),
    contact: (d["contact"] as string) ?? "—",
    contactEmail: (d["contactEmail"] as string) ?? "",
    description: (d["description"] as string) ?? "",
    matchReasons: (d["matchReasons"] as string[]) ?? [],
    requirements: [],
    tenderDocuments: ((d["documents"] as { name?: string; size?: string }[]) ?? []).map((x) => ({
      name: x.name ?? "Document",
      size: x.size ?? "",
    })),
    emails: [],
    activity: [],
  };
}

async function mapTenderFull(id: string, d: F): Promise<Tender> {
  const t = mapTender(id, d);
  const db = getDb();
  try {
    const [reqs, acts, mails] = await Promise.all([
      getDocs(collection(db, "tenders", id, "requirements")),
      getDocs(query(collection(db, "tenders", id, "activity"), orderBy("createdAt", "desc"), limit(30))),
      getDocs(query(collection(db, "emails"), where("tenderId", "==", id), limit(20))),
    ]);
    t.requirements = reqs.docs.map((r, i): Requirement => {
      const rd: F = r.data();
      const met = rd["met"] as boolean | undefined;
      const note = rd["note"] as string | undefined;
      return {
        id: r.id || `req-${i + 1}`,
        name: (rd["label"] as string) ?? "Requirement",
        category: (rd["category"] as string) ?? "Compliance",
        status: met === true ? "COMPLETED" : met === false ? "MISSING" : "REVIEW",
        ...(note ? { attachedDocument: note } : {}),
      };
    });
    t.activity = acts.docs.map((a) => {
      const ad: F = a.data();
      return { date: relTime(ad["createdAt"]), text: (ad["message"] as string) ?? "" };
    });
    t.emails = mails.docs.map((m, i) => {
      const md: F = m.data();
      return {
        id: m.id || `e${i}`,
        date: relTime(md["sentAt"]),
        time: "",
        from: (md["from"] as string) ?? "—",
        subject: (md["subject"] as string) ?? "",
      };
    });
  } catch {
    // subcollection read failed — return the tender without the extras
  }
  return t;
}

// ---------- getters (live with mock fallback) ----------

export async function getTenders(): Promise<Tender[]> {
  if (!isFirebaseConfigured) return mockTenders;
  try {
    const snap = await getDocs(query(collection(getDb(), "tenders"), orderBy("closingDate", "asc"), limit(200)));
    return snap.docs.map((d) => mapTender(d.id, d.data()));
  } catch {
    return mockTenders;
  }
}

export async function getTender(id: string): Promise<Tender | undefined> {
  if (!isFirebaseConfigured) return mockTenders.find((t) => t.id === id);
  try {
    const snap = await getDoc(doc(getDb(), "tenders", id));
    if (!snap.exists()) return undefined;
    return mapTenderFull(snap.id, snap.data());
  } catch {
    return mockTenders.find((t) => t.id === id);
  }
}

export async function getCompanyDocuments(): Promise<CompanyDocument[]> {
  if (!isFirebaseConfigured) return mockDocuments;
  try {
    const snap = await getDocs(query(collection(getDb(), "documents"), orderBy("name"), limit(200)));
    return snap.docs.map((d): CompanyDocument => {
      const x: F = d.data();
      const expires = asDate(x["expiresAt"]);
      const days = expires ? Math.round((new Date(`${expires}T00:00:00Z`).getTime() - Date.now()) / 86_400_000) : null;
      return {
        id: d.id,
        name: (x["name"] as string) ?? "Document",
        category: (x["type"] as string) ?? "Compliance",
        size: (x["size"] as string) ?? "",
        uploaded: relTime(x["uploadedAt"] ?? x["createdAt"]),
        ...(expires ? { expires } : {}),
        status: days === null ? "Valid" : days < 0 ? "Expired" : days <= 30 ? "Expiring soon" : "Valid",
      };
    });
  } catch {
    return mockDocuments;
  }
}

export async function getCompanyProfile() {
  if (!isFirebaseConfigured) return { company: mockCompany, directors: mockDirectors, certifications: mockCertifications, experience: mockExperience };
  try {
    const snap = await getDoc(doc(getDb(), "company", "profile"));
    if (!snap.exists()) throw new Error("no profile");
    const d: F = snap.data();
    const c = (d["company"] as F) ?? d;
    return {
      company: {
        name: (c["name"] as string) ?? mockCompany.name,
        tradingName: (c["tradingName"] as string) ?? mockCompany.tradingName,
        registrationNumber: (c["registrationNumber"] as string) ?? "—",
        vatNumber: (c["vatNumber"] as string) ?? "—",
        type: (c["type"] as string) ?? "Private Company",
        yearEstablished: (c["yearEstablished"] as string) ?? "—",
        physicalAddress: (c["physicalAddress"] as string) ?? "—",
        postalAddress: (c["postalAddress"] as string) ?? "—",
        province: (c["province"] as string) ?? "—",
        city: (c["city"] as string) ?? "—",
        postalCode: (c["postalCode"] as string) ?? "—",
        website: (c["website"] as string) ?? "—",
        email: (c["email"] as string) ?? "—",
        phone: (c["phone"] as string) ?? "—",
        altPhone: (c["altPhone"] as string) ?? "—",
        contactPerson: (c["contactPerson"] as string) ?? "—",
      },
      directors: (d["directors"] as typeof mockDirectors) ?? mockDirectors,
      certifications: (d["certifications"] as typeof mockCertifications) ?? mockCertifications,
      experience: (d["experience"] as typeof mockExperience) ?? mockExperience,
    };
  } catch {
    return { company: mockCompany, directors: mockDirectors, certifications: mockCertifications, experience: mockExperience };
  }
}

export async function getEmailThreads() {
  if (!isFirebaseConfigured) return mockEmailThreads;
  try {
    const snap = await getDocs(query(collection(getDb(), "emails"), orderBy("sentAt", "desc"), limit(50)));
    return snap.docs.map((d) => {
      const x: F = d.data();
      return {
        id: d.id,
        from: (x["direction"] === "out" ? "You" : (x["from"] as string)) ?? "—",
        subject: (x["subject"] as string) ?? "(no subject)",
        preview: ((x["body"] as string) ?? "").slice(0, 90),
        date: relTime(x["sentAt"]),
        unread: !(x["read"] as boolean | undefined) && x["direction"] !== "out",
        tender: (x["tenderTitle"] as string) ?? "",
      };
    });
  } catch {
    return mockEmailThreads;
  }
}

export async function getEmailTemplates() {
  if (!isFirebaseConfigured) return mockEmailTemplates;
  try {
    const snap = await getDocs(query(collection(getDb(), "templates"), orderBy("title"), limit(50)));
    return snap.docs.map((d) => {
      const x: F = d.data();
      return { id: d.id, title: (x["title"] as string) ?? "Template", subject: (x["subject"] as string) ?? "" };
    });
  } catch {
    return mockEmailTemplates;
  }
}

export async function getScraperSources() {
  if (!isFirebaseConfigured) return mockScraperSources;
  try {
    const snap = await getDocs(query(collection(getDb(), "sources"), orderBy("name"), limit(50)));
    return snap.docs.map((d) => {
      const x: F = d.data();
      return {
        id: d.id,
        name: (x["name"] as string) ?? d.id,
        lastRun: relTime(x["lastRun"]),
        found: (x["found"] as number) ?? 0,
        status: x["enabled"] === false ? "Paused" : "Active",
      };
    });
  } catch {
    return mockScraperSources;
  }
}

export async function getScraperRuns() {
  if (!isFirebaseConfigured) return mockScraperRuns;
  try {
    const snap = await getDocs(query(collection(getDb(), "scraperRuns"), orderBy("startedAt", "desc"), limit(20)));
    return snap.docs.map((d) => {
      const x: F = d.data();
      const start = x["startedAt"] as { toMillis?: () => number } | undefined;
      const end = x["finishedAt"] as { toMillis?: () => number } | undefined;
      const secs = start?.toMillis && end?.toMillis ? Math.round((end.toMillis() - start.toMillis()) / 1000) : 0;
      return {
        id: d.id,
        date: relTime(x["startedAt"]),
        duration: secs ? `${Math.floor(secs / 60)}m ${secs % 60}s` : "—",
        found: (x["found"] as number) ?? 0,
        relevant: (x["relevant"] as number) ?? (x["new"] as number) ?? 0,
        status: (x["status"] as string) === "failed" ? "Failed" : "Completed",
      };
    });
  } catch {
    return mockScraperRuns;
  }
}

export async function getNotifications() {
  if (!isFirebaseConfigured) return mockNotifications;
  try {
    const snap = await getDocs(query(collection(getDb(), "notifications"), orderBy("createdAt", "desc"), limit(20)));
    return snap.docs.map((d, i) => {
      const x: F = d.data();
      const type = (x["type"] as string) ?? "info";
      return {
        id: d.id || `n${i}`,
        title: (x["title"] as string) ?? "Notification",
        body: (x["body"] as string) ?? "",
        tone: (type === "deadline" ? "urgent" : type === "document" ? "warning" : type === "match" ? "success" : "info") as "urgent" | "warning" | "info" | "success",
      };
    });
  } catch {
    return mockNotifications;
  }
}

// ---------- mutations (throw a friendly error until configured) ----------

function requireConfigured() {
  if (!isFirebaseConfigured) throw new Error("Firebase is not connected yet — add your web app config first.");
}

export async function setTenderStatus(id: string, status: TenderStatus) {
  requireConfigured();
  await updateDoc(doc(getDb(), "tenders", id), { status });
}

export async function runScraperNow(sources?: string[]): Promise<string> {
  requireConfigured();
  const fn = httpsCallable<{ sources?: string[] }, { message?: string }>(getFirebaseFunctions(), "runScraper");
  const res = await fn(sources ? { sources } : {});
  return res.data?.message ?? "Scraper started.";
}

export async function sendTenderEmail(input: { to: string; subject: string; body: string; tenderId?: string }): Promise<string> {
  requireConfigured();
  const fn = httpsCallable<typeof input, { message?: string }>(getFirebaseFunctions(), "sendEmail");
  const res = await fn(input);
  return res.data?.message ?? "Email sent.";
}

// ---------- hook ----------

export function useLive<T>(key: string, fetcher: () => Promise<T>, fallback: T) {
  const queryClient = useQueryClient();
  const q = useQuery({
    queryKey: ["live", key],
    queryFn: fetcher,
    enabled: isFirebaseConfigured,
    staleTime: 30_000,
    retry: 1,
  });
  return {
    data: q.data ?? fallback,
    isLive: isFirebaseConfigured && !!q.data,
    loading: isFirebaseConfigured && q.isLoading,
    refresh: () => queryClient.invalidateQueries({ queryKey: ["live", key] }),
  };
}
