export type TenderStatus =
  | "NEW"
  | "REVIEWING"
  | "RELEVANT"
  | "IN PROGRESS"
  | "READY"
  | "SUBMITTED"
  | "WON"
  | "LOST"
  | "ARCHIVED";

export type RequirementStatus = "COMPLETED" | "MISSING" | "REVIEW" | "NOT REQUIRED";

export interface Requirement {
  id: string;
  name: string;
  category: string;
  status: RequirementStatus;
  attachedDocument?: string;
}

export interface TenderEmail {
  id: string;
  date: string;
  time: string;
  from: string;
  subject: string;
}

export interface Tender {
  id: string;
  name: string;
  reference: string;
  organisation: string;
  category: string;
  location: string;
  closingDate: string;
  publishedDate: string;
  status: TenderStatus;
  match: number;
  value: string;
  contact: string;
  contactEmail: string;
  description: string;
  matchReasons: string[];
  requirements: Requirement[];
  tenderDocuments: { name: string; size: string }[];
  emails: TenderEmail[];
  activity: { date: string; text: string }[];
}

const baseRequirements = (completed: number, total: number): Requirement[] => {
  const catalogue: [string, string, string][] = [
    ["CIPC Registration Certificate", "Compliance", "CIPC.pdf"],
    ["Tax Compliance Status", "Compliance", "Tax-Compliance.pdf"],
    ["B-BBEE Certificate", "Compliance", "B-BBEE.pdf"],
    ["Bank Confirmation Letter", "Compliance", "Bank-Confirmation.pdf"],
    ["COIDA Letter of Good Standing", "Compliance", "COIDA.pdf"],
    ["CIDB Registration", "Technical", "CIDB.pdf"],
    ["Company Profile", "Technical", "Company-Profile.pdf"],
    ["Health & Safety Plan", "Technical", "HS-Plan.pdf"],
    ["Reference Letters", "Experience", "References.pdf"],
    ["Completed Projects Schedule", "Experience", "Projects.pdf"],
    ["Priced Bill of Quantities", "Pricing", "BOQ.xlsx"],
    ["SBD 1 — Invitation to Bid", "Forms", "SBD1.pdf"],
    ["SBD 4 — Declaration of Interest", "Forms", "SBD4.pdf"],
    ["SBD 6.1 — Preference Points Claim", "Forms", "SBD6.pdf"],
    ["Municipal Rates Account", "Compliance", "Rates.pdf"],
  ];
  return catalogue.slice(0, total).map(([name, category, doc], i) => ({
    id: `req-${i + 1}`,
    name,
    category,
    status: (i < completed ? "COMPLETED" : i === completed ? "REVIEW" : "MISSING") as RequirementStatus,
    ...(i < completed ? { attachedDocument: doc } : {}),
  }));
};

export const tenders: Tender[] = [
  {
    id: "dpw-2026-001",
    name: "Construction of Community Hall",
    reference: "DPW-2026-001",
    organisation: "Department of Public Works",
    category: "Construction",
    location: "Limpopo",
    closingDate: "2026-09-12",
    publishedDate: "2026-08-20",
    status: "IN PROGRESS",
    match: 94,
    value: "R 12 400 000",
    contact: "M. Netshiozwi",
    contactEmail: "tenders@dpw.gov.za",
    description:
      "Construction of a 600m² community hall including ablution facilities, parking, paving and associated external works in the Vhembe District.",
    matchReasons: [
      "Construction industry",
      "Limpopo location",
      "CIDB requirement compatible",
      "Company experience compatible",
    ],
    requirements: baseRequirements(11, 15),
    tenderDocuments: [
      { name: "Tender Document.pdf", size: "4.2 MB" },
      { name: "Pricing Schedule.xlsx", size: "180 KB" },
      { name: "Scope of Work.pdf", size: "1.1 MB" },
      { name: "Specification.pdf", size: "2.6 MB" },
      { name: "Drawing Pack.pdf", size: "18.4 MB" },
    ],
    emails: [
      { id: "e1", date: "Sep 06", time: "11:42", from: "You", subject: "Tender submission sent" },
      { id: "e2", date: "Sep 06", time: "11:58", from: "Department of Public Works", subject: "Submission acknowledged" },
      { id: "e3", date: "Sep 06", time: "12:10", from: "You", subject: "Clarification request sent" },
    ],
    activity: [
      { date: "Sep 06", text: "Bank confirmation letter attached" },
      { date: "Sep 04", text: "Status changed to In Progress" },
      { date: "Aug 21", text: "Tender discovered by scraper" },
    ],
  },
  {
    id: "ral-2026-114",
    name: "Road Maintenance Project",
    reference: "RAL-2026-114",
    organisation: "Roads Agency Limpopo",
    category: "Civil Engineering",
    location: "Limpopo",
    closingDate: "2026-09-09",
    publishedDate: "2026-08-18",
    status: "READY",
    match: 88,
    value: "R 26 750 000",
    contact: "T. Mokoena",
    contactEmail: "bids@ral.co.za",
    description: "Routine road maintenance including pothole repairs, resealing and line marking on the D1235 and D1240 routes.",
    matchReasons: ["Civil works experience", "Limpopo location", "CIDB 6CE compatible"],
    requirements: baseRequirements(14, 15),
    tenderDocuments: [
      { name: "Tender Document.pdf", size: "3.4 MB" },
      { name: "Pricing Schedule.xlsx", size: "210 KB" },
      { name: "Scope of Work.pdf", size: "900 KB" },
    ],
    emails: [{ id: "e1", date: "Sep 02", time: "09:15", from: "You", subject: "Request for clarification" }],
    activity: [{ date: "Sep 05", text: "Pricing captured" }],
  },
  {
    id: "dbe-2026-077",
    name: "School Renovation — Phase 2",
    reference: "DBE-2026-077",
    organisation: "Department of Basic Education",
    category: "Construction",
    location: "Gauteng",
    closingDate: "2026-09-15",
    publishedDate: "2026-08-25",
    status: "RELEVANT",
    match: 81,
    value: "R 8 900 000",
    contact: "P. Dlamini",
    contactEmail: "procurement@dbe.gov.za",
    description: "Renovation of 14 classrooms, roof replacement and upgrade of sanitation facilities.",
    matchReasons: ["Construction industry", "Public sector client", "Company experience compatible"],
    requirements: baseRequirements(6, 15),
    tenderDocuments: [
      { name: "Tender Document.pdf", size: "2.9 MB" },
      { name: "Specification.pdf", size: "1.8 MB" },
    ],
    emails: [],
    activity: [{ date: "Aug 26", text: "Marked as relevant" }],
  },
  {
    id: "mun-2026-208",
    name: "Municipal Landscaping Services",
    reference: "MUN-2026-208",
    organisation: "Polokwane Local Municipality",
    category: "Maintenance",
    location: "Limpopo",
    closingDate: "2026-09-18",
    publishedDate: "2026-08-28",
    status: "NEW",
    match: 72,
    value: "R 3 200 000",
    contact: "L. Sithole",
    contactEmail: "scm@polokwane.gov.za",
    description: "Three-year landscaping and grass-cutting services for municipal parks and road reserves.",
    matchReasons: ["Limpopo location", "Maintenance capability"],
    requirements: baseRequirements(3, 12),
    tenderDocuments: [{ name: "Tender Document.pdf", size: "1.4 MB" }],
    emails: [],
    activity: [{ date: "Aug 28", text: "Tender discovered by scraper" }],
  },
  {
    id: "esk-2026-044",
    name: "Substation Fencing and Security Upgrade",
    reference: "ESK-2026-044",
    organisation: "Eskom Holdings",
    category: "Security",
    location: "Mpumalanga",
    closingDate: "2026-09-24",
    publishedDate: "2026-09-01",
    status: "NEW",
    match: 64,
    value: "R 5 600 000",
    contact: "R. Khumalo",
    contactEmail: "tenders@eskom.co.za",
    description: "Supply and installation of palisade fencing, electric fencing and CCTV at three substations.",
    matchReasons: ["Construction capability", "Fencing experience"],
    requirements: baseRequirements(2, 12),
    tenderDocuments: [{ name: "Tender Document.pdf", size: "2.2 MB" }],
    emails: [],
    activity: [{ date: "Sep 01", text: "Tender discovered by scraper" }],
  },
  {
    id: "dwe-2025-311",
    name: "Bulk Water Pipeline Extension",
    reference: "DWS-2025-311",
    organisation: "Department of Water and Sanitation",
    category: "Civil Engineering",
    location: "Limpopo",
    closingDate: "2026-08-14",
    publishedDate: "2026-07-10",
    status: "SUBMITTED",
    match: 90,
    value: "R 41 000 000",
    contact: "N. Baloyi",
    contactEmail: "bids@dws.gov.za",
    description: "Extension of 12km bulk water pipeline including two pump stations.",
    matchReasons: ["Civil works experience", "Limpopo location"],
    requirements: baseRequirements(15, 15),
    tenderDocuments: [{ name: "Tender Document.pdf", size: "6.1 MB" }],
    emails: [{ id: "e1", date: "Aug 14", time: "10:02", from: "You", subject: "Tender submission sent" }],
    activity: [{ date: "Aug 14", text: "Submission package sent" }],
  },
  {
    id: "trn-2025-902",
    name: "Fleet Maintenance Contract",
    reference: "TRN-2025-902",
    organisation: "Department of Transport",
    category: "Maintenance",
    location: "Gauteng",
    closingDate: "2026-07-30",
    publishedDate: "2026-06-15",
    status: "WON",
    match: 77,
    value: "R 9 800 000",
    contact: "K. Mahlangu",
    contactEmail: "scm@transport.gov.za",
    description: "Scheduled maintenance and repair of a 120-vehicle municipal fleet.",
    matchReasons: ["Maintenance capability", "Public sector client"],
    requirements: baseRequirements(15, 15),
    tenderDocuments: [{ name: "Tender Document.pdf", size: "1.9 MB" }],
    emails: [],
    activity: [{ date: "Aug 20", text: "Award letter received" }],
  },
  {
    id: "hea-2025-556",
    name: "Clinic Electrical Compliance Works",
    reference: "DOH-2025-556",
    organisation: "Department of Health",
    category: "Electrical",
    location: "Limpopo",
    closingDate: "2026-07-11",
    publishedDate: "2026-06-01",
    status: "LOST",
    match: 58,
    value: "R 2 100 000",
    contact: "S. Mabaso",
    contactEmail: "tenders@health.gov.za",
    description: "Electrical compliance upgrades and COC issuing at nine rural clinics.",
    matchReasons: ["Limpopo location"],
    requirements: baseRequirements(12, 12),
    tenderDocuments: [{ name: "Tender Document.pdf", size: "1.1 MB" }],
    emails: [],
    activity: [{ date: "Jul 28", text: "Regret letter received" }],
  },
  {
    id: "arc-2025-013",
    name: "Office Park Repainting",
    reference: "PRV-2025-013",
    organisation: "Aurora Property Group",
    category: "Construction",
    location: "North West",
    closingDate: "2026-06-20",
    publishedDate: "2026-05-12",
    status: "ARCHIVED",
    match: 41,
    value: "R 780 000",
    contact: "J. Pretorius",
    contactEmail: "procurement@aurora.co.za",
    description: "Repainting of exterior facades across a four-building office park.",
    matchReasons: ["Construction industry"],
    requirements: baseRequirements(4, 10),
    tenderDocuments: [{ name: "Tender Document.pdf", size: "640 KB" }],
    emails: [],
    activity: [{ date: "Jun 21", text: "Archived — closed" }],
  },
];

export interface CompanyDocument {
  id: string;
  name: string;
  category: string;
  size: string;
  uploaded: string;
  expires?: string;
  status: "Valid" | "Expiring soon" | "Expired";
}

export const companyDocuments: CompanyDocument[] = [
  { id: "d1", name: "CIPC Registration Certificate.pdf", category: "Compliance", size: "320 KB", uploaded: "12 Jan 2026", status: "Valid" },
  { id: "d2", name: "Tax Compliance Status.pdf", category: "Compliance", size: "210 KB", uploaded: "02 Aug 2026", expires: "02 Nov 2026", status: "Valid" },
  { id: "d3", name: "B-BBEE Certificate.pdf", category: "Compliance", size: "480 KB", uploaded: "14 Mar 2026", expires: "14 Mar 2027", status: "Valid" },
  { id: "d4", name: "Bank Confirmation Letter.pdf", category: "Financial", size: "150 KB", uploaded: "21 Jul 2026", status: "Valid" },
  { id: "d5", name: "COIDA Letter of Good Standing.pdf", category: "Compliance", size: "190 KB", uploaded: "05 Sep 2025", expires: "20 Sep 2026", status: "Expiring soon" },
  { id: "d6", name: "CIDB Registration Certificate.pdf", category: "Technical", size: "260 KB", uploaded: "18 Feb 2026", expires: "18 Feb 2027", status: "Valid" },
  { id: "d7", name: "Company Profile 2026.pdf", category: "Marketing", size: "5.8 MB", uploaded: "30 Jan 2026", status: "Valid" },
  { id: "d8", name: "Health & Safety Plan.pdf", category: "Technical", size: "1.2 MB", uploaded: "11 Apr 2026", status: "Valid" },
  { id: "d9", name: "Public Liability Insurance.pdf", category: "Financial", size: "340 KB", uploaded: "01 Jun 2025", expires: "01 Jun 2026", status: "Expired" },
  { id: "d10", name: "Audited Financials 2025.pdf", category: "Financial", size: "2.4 MB", uploaded: "28 Feb 2026", status: "Valid" },
  { id: "d11", name: "Reference Letters Pack.pdf", category: "Experience", size: "900 KB", uploaded: "16 May 2026", status: "Valid" },
  { id: "d12", name: "Municipal Rates Account.pdf", category: "Compliance", size: "120 KB", uploaded: "01 Sep 2026", status: "Valid" },
];

export const company = {
  name: "Mphela Industries (Pty) Ltd",
  tradingName: "Mphela Industries",
  registrationNumber: "2016/442189/07",
  vatNumber: "4890271633",
  type: "Private Company",
  yearEstablished: "2016",
  physicalAddress: "24 Grobler Street, Polokwane Central",
  postalAddress: "PO Box 1182, Polokwane",
  province: "Limpopo",
  city: "Polokwane",
  postalCode: "0700",
  website: "www.mphelaindustries.co.za",
  email: "info@mphelaindustries.co.za",
  phone: "+27 15 291 4477",
  altPhone: "+27 82 554 1120",
  contactPerson: "Lufuno Mphela",
};

export const directors = [
  { id: "dir1", name: "Lufuno Mphela", role: "Managing Director", idNumber: "8•••••••••••83" },
  { id: "dir2", name: "Thandi Mphela", role: "Financial Director", idNumber: "9•••••••••••17" },
  { id: "dir3", name: "Sipho Radebe", role: "Technical Director", idNumber: "8•••••••••••42" },
];

export const certifications = [
  { id: "c1", name: "CIDB Grading", value: "6GB PE", expires: "18 Feb 2027" },
  { id: "c2", name: "B-BBEE Level", value: "Level 1 (135%)", expires: "14 Mar 2027" },
  { id: "c3", name: "CSD Registration", value: "MAAA0912344", expires: "—" },
  { id: "c4", name: "NHBRC", value: "Registered", expires: "30 Nov 2026" },
];

export const experience = [
  { id: "x1", project: "Thohoyandou Community Centre", client: "Vhembe District Municipality", value: "R 14 200 000", year: "2024", duration: "11 months" },
  { id: "x2", project: "Seshego Clinic Upgrade", client: "Department of Health", value: "R 6 800 000", year: "2023", duration: "7 months" },
  { id: "x3", project: "D1188 Road Rehabilitation", client: "Roads Agency Limpopo", value: "R 22 500 000", year: "2023", duration: "14 months" },
  { id: "x4", project: "Mokopane Sports Complex", client: "Mogalakwena Municipality", value: "R 18 900 000", year: "2022", duration: "13 months" },
  { id: "x5", project: "Giyani Water Reticulation", client: "Department of Water and Sanitation", value: "R 31 400 000", year: "2021", duration: "18 months" },
];

export const emailThreads = [
  { id: "m1", from: "Department of Public Works", subject: "Submission acknowledged — DPW-2026-001", preview: "We hereby acknowledge receipt of your tender submission...", date: "Sep 06", unread: true, tender: "Construction of Community Hall" },
  { id: "m2", from: "Roads Agency Limpopo", subject: "Clarification — Bill of Quantities item 3.4", preview: "Please note the revised quantity for item 3.4 as per addendum 1...", date: "Sep 05", unread: true, tender: "Road Maintenance Project" },
  { id: "m3", from: "You", subject: "Request for site inspection details", preview: "Kindly confirm the compulsory briefing session venue and time...", date: "Sep 04", unread: false, tender: "School Renovation — Phase 2" },
  { id: "m4", from: "Polokwane Local Municipality", subject: "Addendum 1 issued", preview: "An addendum has been issued for tender MUN-2026-208...", date: "Sep 03", unread: false, tender: "Municipal Landscaping Services" },
  { id: "m5", from: "Department of Water and Sanitation", subject: "Bid opening register", preview: "Attached is the bid opening register for DWS-2025-311...", date: "Aug 15", unread: false, tender: "Bulk Water Pipeline Extension" },
];

export const emailTemplates = [
  { id: "t1", title: "Tender Submission", subject: "Tender Submission — [Tender Reference]" },
  { id: "t2", title: "Tender Clarification", subject: "Request for Clarification — [Tender Reference]" },
  { id: "t3", title: "Tender Follow-up", subject: "Follow-up on Tender Submission — [Tender Reference]" },
  { id: "t4", title: "Request for Information", subject: "Request for Information — [Tender Reference]" },
  { id: "t5", title: "Tender Withdrawal", subject: "Withdrawal of Tender — [Tender Reference]" },
  { id: "t6", title: "General Introduction", subject: "Company Introduction — Mphela Industries" },
];

export const scraperSources = [
  { id: "s1", name: "eTenders Portal", lastRun: "Today, 06:00", found: 62, status: "Active" },
  { id: "s2", name: "Limpopo Provincial Treasury", lastRun: "Today, 06:05", found: 24, status: "Active" },
  { id: "s3", name: "Polokwane Municipality", lastRun: "Today, 06:09", found: 11, status: "Active" },
  { id: "s4", name: "Eskom Tender Bulletin", lastRun: "Yesterday, 18:00", found: 18, status: "Active" },
  { id: "s5", name: "Private Sector Feed", lastRun: "3 days ago", found: 12, status: "Paused" },
];

export const scraperRuns = [
  { id: "r1", date: "06 Sep 2026, 06:00", duration: "4m 12s", found: 31, relevant: 7, status: "Completed" },
  { id: "r2", date: "05 Sep 2026, 06:00", duration: "3m 48s", found: 26, relevant: 5, status: "Completed" },
  { id: "r3", date: "04 Sep 2026, 06:00", duration: "5m 02s", found: 34, relevant: 9, status: "Completed" },
  { id: "r4", date: "03 Sep 2026, 06:00", duration: "2m 55s", found: 19, relevant: 3, status: "Completed" },
];

export const notifications = [
  { id: "n1", title: "Tender closing tomorrow", body: "Road Maintenance Tender closes in 18 hours.", tone: "urgent" as const },
  { id: "n2", title: "3 documents missing", body: "ABC Construction tender still requires 3 documents.", tone: "warning" as const },
  { id: "n3", title: "New tenders discovered", body: "14 new tenders were added.", tone: "info" as const },
  { id: "n4", title: "Document expiring", body: "COIDA Letter of Good Standing expires in 14 days.", tone: "warning" as const },
  { id: "n5", title: "Submission acknowledged", body: "Department of Public Works acknowledged DPW-2026-001.", tone: "success" as const },
];

export const daysUntil = (date: string) => {
  const now = new Date("2026-09-06T00:00:00Z").getTime();
  const then = new Date(`${date}T00:00:00Z`).getTime();
  return Math.round((then - now) / 86_400_000);
};

export const formatDate = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
