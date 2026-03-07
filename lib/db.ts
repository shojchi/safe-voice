import { v4 as uuidv4 } from "uuid";

export interface Case {
  id: string;
  caseNumber: string;
  createdAt: string;
  status: "open" | "closed";
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

const globalForDb = globalThis as unknown as {
  cases: Case[];
  statements: Statement[];
};

export const db = {
  cases: globalForDb.cases || [
    {
      id: "case-123",
      caseNumber: "MPD-2023-001",
      createdAt: new Date().toISOString(),
      status: "open",
    },
    {
      id: "public-reports",
      caseNumber: "PUBLIC-REPORTS",
      createdAt: new Date().toISOString(),
      status: "open",
    },
  ],
  statements: globalForDb.statements || [
    {
      id: "stmt-1",
      caseId: "public-reports",
      type: "crime",
      location: { lat: 32.3792, lng: -86.3077 }, // Downtown Montgomery
      transcript:
        "I was walking my dog around 11:15 PM near the corner of Elm and 4th. I heard a loud pop, sounded like a firecracker but deeper. Then I saw a guy running south on Elm. He was maybe 5'10\", wearing a dark hoodie and jeans. He jumped into a silver sedan, maybe a Honda Civic, that was idling down the block. The car sped off towards the highway. I noticed the car had a dent on the rear passenger side.",
      structuredData: {
        suspectDescription:
          "Male, approx 5'10\", wearing dark hoodie and jeans.",
        vehicleDescription:
          "Silver sedan, possibly Honda Civic, dent on rear passenger side.",
        timeline: "Around 11:15 PM.",
        locationDetails: "Corner of Elm and 4th, running south on Elm.",
        uniqueDetails: ["Dent on rear passenger side of vehicle"],
      },
      credibilityScore: 85,
      corroboratedDetails: ["Time of incident (11:15 PM)", "Silver sedan"],
      conflictingDetails: [],
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "stmt-2",
      caseId: "public-reports",
      type: "hazard",
      location: { lat: 32.3592, lng: -86.1677 }, // Eastchase area
      transcript: "There's a massive brush fire spreading near the shopping center. The wind is blowing it west towards the highway. Visibility is getting really bad with all the smoke.",
      structuredData: {
        hazardCategory: "fire",
        fireDirection: "West towards the highway",
        windSpeed: "High",
        trappedIndividuals: "None seen",
        roadBlockages: "None yet, but smoke is covering the road",
        visibility: "Poor due to smoke"
      },
      credibilityScore: 90,
      corroboratedDetails: [],
      conflictingDetails: [],
      createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 mins ago
    },
    {
      id: "stmt-3",
      caseId: "public-reports",
      type: "hazard",
      location: { lat: 32.3822, lng: -86.3577 }, // Maxwell AFB area
      transcript: "Major multi-car pileup on the interstate. Looks like at least 4 cars involved. Traffic is completely stopped in the northbound lanes.",
      structuredData: {
        hazardCategory: "traffic",
        fireDirection: "",
        windSpeed: "",
        trappedIndividuals: "Unknown, people are still in cars",
        roadBlockages: "Northbound lanes completely blocked",
        visibility: "Clear"
      },
      credibilityScore: 95,
      corroboratedDetails: [],
      conflictingDetails: [],
      createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    },
    {
      id: "stmt-4",
      caseId: "public-reports",
      type: "hazard",
      location: { lat: 32.3222, lng: -86.2577 }, // South Montgomery
      transcript: "Severe flooding on the main road here. The water is at least two feet deep and a couple of cars are stalled out. Nobody should try to drive through this.",
      structuredData: {
        hazardCategory: "water",
        fireDirection: "",
        windSpeed: "",
        trappedIndividuals: "People in stalled cars",
        roadBlockages: "Main road impassable due to flooding",
        visibility: "Raining heavily"
      },
      credibilityScore: 88,
      corroboratedDetails: [],
      conflictingDetails: [],
      createdAt: new Date(Date.now() - 14400000).toISOString(), // 4 hours ago
    }
  ],
};

if (process.env.NODE_ENV !== "production") {
  globalForDb.cases = db.cases;
  globalForDb.statements = db.statements;
}

export function createCase(caseNumber: string): Case {
  const newCase: Case = {
    id: uuidv4(),
    caseNumber,
    createdAt: new Date().toISOString(),
    status: "open",
  };
  db.cases.push(newCase);
  return newCase;
}

export function getCases(): Case[] {
  return db.cases;
}

export function getCaseById(id: string): Case | undefined {
  return db.cases.find((c) => c.id === id);
}

export function addStatement(
  statement: Omit<Statement, "id" | "createdAt">,
): Statement {
  const newStatement: Statement = {
    ...statement,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  db.statements.push(newStatement);
  return newStatement;
}

export function getStatementsByCaseId(caseId: string): Statement[] {
  return db.statements.filter((s) => s.caseId === caseId);
}
