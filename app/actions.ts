"use server";

import {
  createCase,
  getCases,
  getCaseById,
  addStatement,
  getStatementsByCaseId,
  findOrCreateTemporaryCase,
  updateCaseNumber,
} from "@/lib/db";
import { GoogleGenAI, Type } from "@google/genai";

export async function createNewCase(caseNumber: string) {
  return createCase(caseNumber);
}

export async function fetchCases() {
  return getCases();
}

export async function fetchCaseDetails(id: string) {
  return getCaseById(id);
}

export async function fetchStatements(caseId: string) {
  return getStatementsByCaseId(caseId);
}

export async function saveStatement(
  caseId: string,
  type: "crime" | "hazard",
  location: { lat: number; lng: number } | undefined,
  transcript: string,
  structuredData: any,
  credibilityScore: number,
  corroboratedDetails: string[],
  conflictingDetails: string[]
) {
  try {
    let actualCaseId = caseId;
    if (caseId === "public-reports") {
      actualCaseId = findOrCreateTemporaryCase(type, location, structuredData);
    }

    const newStatement = addStatement({
      caseId: actualCaseId,
      type,
      location,
      transcript,
      structuredData,
      credibilityScore,
      corroboratedDetails,
      conflictingDetails,
    });
    return { success: true, statement: newStatement };
  } catch (error: any) {
    console.error("Error saving statement:", error);
    return { success: false, error: error.message || "Failed to save statement" };
  }
}

export async function assignCadNumber(caseId: string, cadNumber: string) {
  const updated = updateCaseNumber(caseId, cadNumber);
  if (updated) return { success: true, case: updated };
  return { success: false, error: "Case not found" };
}
