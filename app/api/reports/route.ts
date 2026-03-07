import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Return all statements that have a location
  const statementsWithLocation = db.statements.filter((s) => s.location);
  return NextResponse.json(statementsWithLocation);
}
