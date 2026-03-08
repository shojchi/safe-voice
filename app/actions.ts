"use server";

import {
  createCase,
  getCases,
  getCaseById,
  addStatement,
  getStatementsByCaseId,
  findOrCreateTemporaryCase,
  updateCaseNumber,
  seedDatabase,
  deleteCase,
  deleteStatement,
} from "@/lib/db";

export async function removeCase(id: string) {
  return await deleteCase(id);
}

export async function removeStatement(id: string) {
  return await deleteStatement(id);
}

export async function createNewCase(caseNumber: string) {
  return await createCase(caseNumber);
}

export async function fetchCases() {
  return await getCases();
}

export async function fetchCaseDetails(id: string) {
  return await getCaseById(id);
}

export async function fetchStatements(caseId: string) {
  return await getStatementsByCaseId(caseId);
}

export async function saveStatement(
  caseId: string,
  type: "crime" | "hazard",
  location: { lat: number; lng: number } | undefined,
  transcript: string,
  structuredData: any,
  credibilityScore: number,
  corroboratedDetails: string[],
  conflictingDetails: string[],
) {
  try {
    let actualCaseId = caseId;
    if (caseId === "public-reports") {
      actualCaseId = await findOrCreateTemporaryCase(
        type,
        location,
        structuredData,
      );
    }

    const newStatement = await addStatement({
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
    return {
      success: false,
      error: error.message || "Failed to save statement",
    };
  }
}

export async function assignCadNumber(caseId: string, cadNumber: string) {
  const updated = await updateCaseNumber(caseId, cadNumber);
  if (updated) return { success: true, case: updated };
  return { success: false, error: "Case not found" };
}

export async function runDatabaseSeed() {
  return await seedDatabase();
}
