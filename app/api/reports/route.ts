import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Return statements that have a location, and filter out anonymous crime reports
  const filteredStatements = db.statements.filter((s) => {
    if (!s.location) return false;
    
    // Filter out anonymous crime reports
    if (s.type === "crime" && s.structuredData?.isAnonymous) {
      return false;
    }
    
    return true;
  });
  
  return NextResponse.json(filteredStatements);
}
