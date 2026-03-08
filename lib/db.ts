import { v4 as uuidv4 } from "uuid";
import { firestore } from "./firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";

export interface Case {
  id: string;
  caseNumber: string;
  createdAt: string;
  status: "open" | "closed";
  isTemporary?: boolean;
  location?: { lat: number; lng: number };
}

export interface Statement {
  id: string;
  caseId: string;
  type: "crime" | "hazard";
  location?: { lat: number; lng: number };
  transcript: string;
  structuredData: any;
  credibilityScore: number;
  corroboratedDetails: string[];
  conflictingDetails: string[];
  createdAt: string;
}

const casesCol = collection(firestore, "cases");
const statementsCol = collection(firestore, "statements");

// Firestore does not accept `undefined` as a field value.
// Strip undefined keys before writing.
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T;
}

export async function createCase(caseNumber: string): Promise<Case> {
  const newCase: Omit<Case, "id"> = {
    caseNumber,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  const docRef = await addDoc(casesCol, newCase);
  return { id: docRef.id, ...newCase };
}

export async function getCases(): Promise<Case[]> {
  const snapshot = await getDocs(casesCol);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Case);
}

export async function getCaseById(id: string): Promise<Case | undefined> {
  const docRef = doc(firestore, "cases", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return undefined;
  return { id: snapshot.id, ...snapshot.data() } as Case;
}

export async function addStatement(
  statement: Omit<Statement, "id" | "createdAt">,
): Promise<Statement> {
  const data = stripUndefined({
    ...statement,
    createdAt: new Date().toISOString(),
  });
  const docRef = await addDoc(statementsCol, data);
  return { id: docRef.id, ...data };
}

export async function getStatementsByCaseId(
  caseId: string,
): Promise<Statement[]> {
  const q = query(statementsCol, where("caseId", "==", caseId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Statement);
}

export async function getAllStatements(): Promise<Statement[]> {
  const snapshot = await getDocs(statementsCol);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Statement);
}

export async function findOrCreateTemporaryCase(
  type: "crime" | "hazard",
  location?: { lat: number; lng: number },
  structuredData?: any,
): Promise<string> {
  const now = Date.now();
  const THIRTY_MINS = 30 * 60 * 1000;

  // Query for recent temporary open cases
  const q = query(
    casesCol,
    where("isTemporary", "==", true),
    where("status", "==", "open"),
  );
  const snapshot = await getDocs(q);

  const recentCases = snapshot.docs
    .map((d) => ({ id: d.id, ...d.data() }) as Case)
    .filter((c) => now - new Date(c.createdAt).getTime() <= THIRTY_MINS);

  let matchedCase: Case | null = null;

  if (location) {
    matchedCase =
      recentCases.find((c) => {
        if (!c.location) return false;

        // Haversine distance in meters
        const R = 6371e3;
        const lat1 = (c.location.lat * Math.PI) / 180;
        const lat2 = (location.lat * Math.PI) / 180;
        const dLat = ((location.lat - c.location.lat) * Math.PI) / 180;
        const dLng = ((location.lng - c.location.lng) * Math.PI) / 180;

        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1) *
            Math.cos(lat2) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c_rad = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c_rad;

        return distance <= 500;
      }) || null;
  }

  if (matchedCase) {
    return matchedCase.id;
  }

  // Build case name from AI-extracted data
  let incidentName = type === "crime" ? "Suspicious Activity" : "Hazard";
  if (structuredData) {
    if (structuredData.shortTitle) {
      incidentName = structuredData.shortTitle;
    } else if (type === "crime" && structuredData.suspectDescription) {
      incidentName = "Crime Report";
    } else if (type === "hazard" && structuredData.hazardCategory) {
      incidentName =
        structuredData.hazardCategory.charAt(0).toUpperCase() +
        structuredData.hazardCategory.slice(1) +
        " Incident";
    }
  }

  const timeString = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  let locString = "Unknown Location";
  if (structuredData && structuredData.humanReadableLocation) {
    locString = structuredData.humanReadableLocation;
  } else if (location) {
    locString = `Lat: ${location.lat.toFixed(2)}, Lng: ${location.lng.toFixed(2)}`;
  }

  const caseNumber = `${incidentName} - ${locString} - ${timeString}`;

  const newCaseData = stripUndefined({
    caseNumber,
    createdAt: new Date().toISOString(),
    status: "open",
    isTemporary: true,
    location,
  });

  const docRef = await addDoc(casesCol, newCaseData);
  return docRef.id;
}

export async function updateCaseNumber(
  id: string,
  newCaseNumber: string,
): Promise<Case | undefined> {
  const docRef = doc(firestore, "cases", id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return undefined;

  await updateDoc(docRef, {
    caseNumber: newCaseNumber,
    isTemporary: false,
  });

  return {
    id: snapshot.id,
    ...snapshot.data(),
    caseNumber: newCaseNumber,
    isTemporary: false,
  } as Case;
}

export async function seedDatabase() {
  const montgomeryBaseLat = 32.361538;
  const montgomeryBaseLng = -86.279118;

  // Case 1: Crime - Theft/Burglary
  const c1Ref = await addDoc(casesCol, {
    caseNumber: "Pharmacy Break-in - Elm St - 10:45 PM",
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago
    status: "open",
    isTemporary: true,
    location: { lat: montgomeryBaseLat + 0.01, lng: montgomeryBaseLng - 0.01 },
  });
  await addDoc(statementsCol, {
    caseId: c1Ref.id,
    type: "crime",
    location: { lat: montgomeryBaseLat + 0.01, lng: montgomeryBaseLng - 0.01 },
    transcript:
      "I see a guy in a red hoodie prying open the back door of the pharmacy on Elm Street. He's got a crowbar.",
    structuredData: {
      incidentType: "Theft / Burglary",
      shortTitle: "Pharmacy Break-in",
      humanReadableLocation: "Elm Street Pharmacy",
      suspectDescription: "Male, wearing a red hoodie, carrying a crowbar",
      weaponReported: "Crowbar",
    },
    credibilityScore: 92,
    corroboratedDetails: [
      "Location verified",
      "Business closed at time of report",
    ],
    conflictingDetails: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  });

  // Case 2: Crime - Vehicle Crash / Hit and run
  const c2Ref = await addDoc(casesCol, {
    caseNumber: "Hit and Run - Main St - 11:30 PM",
    createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hrs ago
    status: "open",
    isTemporary: true,
    location: { lat: montgomeryBaseLat - 0.02, lng: montgomeryBaseLng + 0.015 },
  });
  await addDoc(statementsCol, {
    caseId: c2Ref.id,
    type: "crime",
    location: { lat: montgomeryBaseLat - 0.02, lng: montgomeryBaseLng + 0.015 },
    transcript:
      "A blue sedan just rear-ended a parked car and sped off heading north on Main st. License plate was XYZ something.",
    structuredData: {
      incidentType: "Vehicle Crash",
      shortTitle: "Hit and Run",
      humanReadableLocation: "Main St",
      suspectDescription: "Blue sedan, partial plate XYZ",
      vehicleDescription: "Blue sedan with front-end damage",
    },
    credibilityScore: 85,
    corroboratedDetails: ["Matched vehicle debris at scene"],
    conflictingDetails: ["Direction of travel differs from another 911 call"],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  });

  // Case 3: Hazard - Fire
  const c3Ref = await addDoc(casesCol, {
    caseNumber: "Brush Fire - Regional Park - 08:15 AM",
    createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 hrs ago
    status: "open",
    isTemporary: true,
    location: { lat: montgomeryBaseLat + 0.03, lng: montgomeryBaseLng + 0.03 },
  });
  await addDoc(statementsCol, {
    caseId: c3Ref.id,
    type: "hazard",
    location: { lat: montgomeryBaseLat + 0.03, lng: montgomeryBaseLng + 0.03 },
    transcript:
      "There's a massive brush fire spreading near the regional park. Wind is blowing hard towards the residential area on the east side.",
    structuredData: {
      incidentType: "Fire / Hazard",
      shortTitle: "Brush Fire",
      humanReadableLocation: "Regional Park",
      hazardCategory: "fire",
      fireDirection: "East towards residential area",
      windSpeed: "High",
    },
    credibilityScore: 95,
    corroboratedDetails: [
      "Multiple reports received",
      "Smoke visible on weather radar",
    ],
    conflictingDetails: [],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
  });

  // Case 4: Hazard - Water/Flood
  const c4Ref = await addDoc(casesCol, {
    caseNumber: "Severe Flooding - River Road - 02:45 PM",
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 24 hrs ago
    status: "open",
    isTemporary: false,
    location: {
      lat: montgomeryBaseLat - 0.015,
      lng: montgomeryBaseLng - 0.025,
    },
  });
  await updateDoc(doc(firestore, "cases", c4Ref.id), {
    caseNumber: "CAD-2026-00142",
    isTemporary: false,
  });
  await addDoc(statementsCol, {
    caseId: c4Ref.id,
    type: "hazard",
    location: {
      lat: montgomeryBaseLat - 0.015,
      lng: montgomeryBaseLng - 0.025,
    },
    transcript:
      "The river has overflowed onto River Road. Three cars are stuck in the water, people are standing on their roofs shouting for help.",
    structuredData: {
      incidentType: "Fire / Hazard",
      shortTitle: "Severe Flooding",
      humanReadableLocation: "River Road",
      hazardCategory: "water",
      trappedIndividuals: "People on car roofs",
      roadBlockages: "River Road entirely flooded",
    },
    credibilityScore: 98,
    corroboratedDetails: ["River gauge shows flood stage"],
    conflictingDetails: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  });

  // Case 5: Hazard - Traffic/Road Blockage
  const c5Ref = await addDoc(casesCol, {
    caseNumber: "Fallen Tree & Power Lines - Highway 9 - 04:20 PM",
    createdAt: new Date(Date.now() - 100000).toISOString(), // just now
    status: "open",
    isTemporary: true,
    location: { lat: montgomeryBaseLat + 0.005, lng: montgomeryBaseLng + 0.02 },
  });
  await addDoc(statementsCol, {
    caseId: c5Ref.id,
    type: "hazard",
    location: { lat: montgomeryBaseLat + 0.005, lng: montgomeryBaseLng + 0.02 },
    transcript:
      "A large oak tree just fell across Highway 9, completely blocking both lanes. It took down some power lines which are sparking on the road.",
    structuredData: {
      incidentType: "Road Blockage",
      shortTitle: "Fallen Tree & Lines",
      humanReadableLocation: "Highway 9",
      hazardCategory: "traffic",
      roadBlockages: "Highway 9 completely blocked",
      electricalHazards: "Live sparking power lines on ground",
    },
    credibilityScore: 90,
    corroboratedDetails: ["Power company reports outage in grid"],
    conflictingDetails: [],
    createdAt: new Date(Date.now() - 100000).toISOString(),
  });

  return { success: true };
}

export async function deleteStatement(id: string): Promise<boolean> {
  try {
    const docRef = doc(firestore, "statements", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting statement:", error);
    return false;
  }
}

export async function deleteCase(id: string): Promise<boolean> {
  try {
    // Delete all associated statements first
    const statements = await getStatementsByCaseId(id);
    await Promise.all(statements.map((stmt) => deleteStatement(stmt.id)));

    // Delete the case
    const docRef = doc(firestore, "cases", id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting case:", error);
    return false;
  }
}
