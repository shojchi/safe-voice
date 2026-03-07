"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchCaseDetails, fetchStatements } from "@/app/actions";
import {
  ArrowLeft,
  Printer,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Car,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Case, Statement } from "@/lib/db";
import Link from "next/link";

export default function CaseDetails() {
  const params = useParams();
  const caseId = params.caseId as string;
  const router = useRouter();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [c, s] = await Promise.all([
          fetchCaseDetails(caseId),
          fetchStatements(caseId),
        ]);
        if (c) setCaseData(c);
        setStatements(s || []);
      } catch (error) {
        console.error("Failed to load case details:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [caseId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">Case not found</h1>
        <button
          onClick={() => router.push("/investigator")}
          className="text-amber-600 hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/investigator"
              className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-amber-100 rounded text-amber-700">
                <ShieldAlert size={20} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                Case {caseData.caseNumber}
              </h1>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm print:hidden"
          >
            <Printer size={16} />
            <span>Print to PDF</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-800">
              Statements ({statements.length})
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              AI-structured witness statements collected anonymously.
            </p>
          </div>
        </div>

        {statements.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <FileText size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">
              No statements collected yet for this case.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {statements.map((stmt) => (
              <div
                key={stmt.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Statement ID
                      </span>
                      <span className="font-mono text-sm text-slate-700">
                        {stmt.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200"></div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Submitted
                      </span>
                      <span className="text-sm text-slate-700 flex items-center space-x-1">
                        <Clock size={14} className="text-slate-400" />
                        <span>
                          {formatDistanceToNow(new Date(stmt.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Credibility
                      </span>
                      <div className="flex items-center space-x-1">
                        <div
                          className={`h-2 w-2 rounded-full ${stmt.credibilityScore >= 80 ? "bg-emerald-500" : stmt.credibilityScore >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                        ></div>
                        <span className="font-bold text-slate-800">
                          {stmt.credibilityScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Extracted Details
                    </h3>

                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <User
                          size={18}
                          className="text-indigo-500 mt-0.5 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase">
                            Suspect
                          </h4>
                          <p className="text-sm text-slate-800 mt-0.5">
                            {stmt.structuredData.suspectDescription ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Car
                          size={18}
                          className="text-indigo-500 mt-0.5 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase">
                            Vehicle
                          </h4>
                          <p className="text-sm text-slate-800 mt-0.5">
                            {stmt.structuredData.vehicleDescription ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <Clock
                          size={18}
                          className="text-indigo-500 mt-0.5 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase">
                            Timeline
                          </h4>
                          <p className="text-sm text-slate-800 mt-0.5">
                            {stmt.structuredData.timeline || "Not provided"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <MapPin
                          size={18}
                          className="text-indigo-500 mt-0.5 shrink-0"
                        />
                        <div>
                          <h4 className="text-xs font-semibold text-slate-500 uppercase">
                            Location
                          </h4>
                          <p className="text-sm text-slate-800 mt-0.5">
                            {stmt.structuredData.locationDetails ||
                              "Not provided"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {stmt.structuredData.uniqueDetails &&
                      stmt.structuredData.uniqueDetails.length > 0 && (
                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                          <h4 className="text-xs font-bold text-amber-800 uppercase mb-2 flex items-center space-x-1">
                            <AlertTriangle size={14} />
                            <span>Unique Details Flagged</span>
                          </h4>
                          <ul className="list-disc list-inside text-sm text-amber-900 space-y-1">
                            {stmt.structuredData.uniqueDetails.map(
                              (detail: string, idx: number) => (
                                <li key={idx}>{detail}</li>
                              ),
                            )}
                          </ul>
                        </div>
                      )}
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Full Transcript
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm text-slate-700 leading-relaxed italic">
                      &quot;{stmt.transcript}&quot;
                    </div>

                    {(stmt.corroboratedDetails.length > 0 ||
                      stmt.conflictingDetails.length > 0) && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        {stmt.corroboratedDetails.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center space-x-1">
                              <CheckCircle2 size={14} />
                              <span>Corroborated Details</span>
                            </h4>
                            <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1">
                              {stmt.corroboratedDetails.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {stmt.conflictingDetails.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center space-x-1">
                              <AlertTriangle size={14} />
                              <span>Conflicting Details</span>
                            </h4>
                            <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                              {stmt.conflictingDetails.map((detail, idx) => (
                                <li key={idx}>{detail}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
