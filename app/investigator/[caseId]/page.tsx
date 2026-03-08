"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  fetchCaseDetails,
  fetchStatements,
  assignCadNumber,
  removeCase,
  removeStatement,
} from "@/app/actions";
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
  Edit2,
  Flame,
  Wind,
  Users,
  EyeOff,
  AlertOctagon,
  Trash2,
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

  const [isEditingCad, setIsEditingCad] = useState(false);
  const [newCadNumber, setNewCadNumber] = useState("");
  const [isSavingCad, setIsSavingCad] = useState(false);

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

  const handleSaveCad = async () => {
    if (!newCadNumber.trim() || !caseData) return;
    setIsSavingCad(true);
    try {
      const res = await assignCadNumber(caseData.id, newCadNumber.trim());
      if (res.success && res.case) {
        setCaseData(res.case);
        setIsEditingCad(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingCad(false);
    }
  };

  const handleDeleteCase = async () => {
    if (
      confirm(
        "Are you sure you want to delete this case? All associated statements will also be deleted.",
      )
    ) {
      try {
        const success = await removeCase(caseId);
        if (success) {
          router.push("/investigator");
        } else {
          alert("Failed to delete case.");
        }
      } catch (error) {
        console.error("Error deleting case:", error);
      }
    }
  };

  const handleDeleteStatement = async (statementId: string) => {
    if (confirm("Are you sure you want to delete this statement?")) {
      try {
        const success = await removeStatement(statementId);
        if (success) {
          setStatements(statements.filter((s) => s.id !== statementId));
        } else {
          alert("Failed to delete statement.");
        }
      } catch (error) {
        console.error("Error deleting statement:", error);
      }
    }
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
              <div className="flex items-center space-x-2">
                {isEditingCad ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newCadNumber}
                      onChange={(e) => setNewCadNumber(e.target.value)}
                      placeholder="Enter CAD Number"
                      className="px-3 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveCad}
                      disabled={isSavingCad}
                      className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors disabled:opacity-50"
                    >
                      {isSavingCad ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => setIsEditingCad(false)}
                      className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-lg font-bold text-slate-800">
                      Case {caseData.caseNumber}
                    </h1>
                    {caseData.isTemporary && (
                      <button
                        onClick={() => {
                          setNewCadNumber("");
                          setIsEditingCad(true);
                        }}
                        className="p-1 text-slate-400 hover:text-amber-600 transition-colors rounded"
                        title="Assign Official CAD Number"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3 print:hidden">
            <button
              onClick={handleDeleteCase}
              className="flex items-center space-x-2 text-red-600 hover:bg-red-50 border border-red-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              <span>Delete Case</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              <Printer size={16} />
              <span>Print to PDF</span>
            </button>
          </div>
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
                    <div className="h-8 w-px bg-slate-200 ml-2 border-l border-slate-200"></div>
                    <button
                      onClick={() => handleDeleteStatement(stmt.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete Statement"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="p-6 grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Extracted Details
                    </h3>

                    <div className="space-y-4">
                      {stmt.type === "crime" ? (
                        <>
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
                        </>
                      ) : (
                        <>
                          <div className="flex items-start space-x-3">
                            <AlertTriangle
                              size={18}
                              className="text-amber-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                Hazard Category
                              </h4>
                              <p className="text-sm text-slate-800 mt-0.5 capitalize">
                                {stmt.structuredData.hazardCategory ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <Flame
                              size={18}
                              className="text-orange-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                Fire Direction
                              </h4>
                              <p className="text-sm text-slate-800 mt-0.5">
                                {stmt.structuredData.fireDirection ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <Wind
                              size={18}
                              className="text-blue-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                Wind Speed/Direction
                              </h4>
                              <p className="text-sm text-slate-800 mt-0.5">
                                {stmt.structuredData.windSpeed ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <Users
                              size={18}
                              className="text-rose-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                Trapped Individuals
                              </h4>
                              <p className="text-sm text-slate-800 mt-0.5">
                                {stmt.structuredData.trappedIndividuals ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <AlertOctagon
                              size={18}
                              className="text-slate-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                Road Blockages
                              </h4>
                              <p className="text-sm text-slate-800 mt-0.5">
                                {stmt.structuredData.roadBlockages ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-3">
                            <EyeOff
                              size={18}
                              className="text-slate-500 mt-0.5 shrink-0"
                            />
                            <div>
                              <h4 className="text-xs font-semibold text-slate-500 uppercase">
                                Visibility
                              </h4>
                              <p className="text-sm text-slate-800 mt-0.5">
                                {stmt.structuredData.visibility ||
                                  "Not provided"}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
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
