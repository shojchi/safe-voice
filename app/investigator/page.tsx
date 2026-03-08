"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCases, runDatabaseSeed, removeCase } from "@/app/actions";
import {
  FileText,
  ArrowRight,
  Search,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Database,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Case } from "@/lib/db";

export default function InvestigatorDashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadCases = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCases();
      setCases(data);
    } catch (error) {
      console.error("Failed to load cases:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const res = await runDatabaseSeed();
      if (res.success) {
        await loadCases();
      }
    } catch (e) {
      console.error("Failed to seed db", e);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleDeleteCase = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigating to the case details
    if (
      confirm(
        "Are you sure you want to delete this case? All associated statements will also be deleted.",
      )
    ) {
      try {
        const success = await removeCase(id);
        if (success) {
          await loadCases();
        } else {
          alert("Failed to delete case. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting case:", error);
        alert("An error occurred while deleting the case.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-amber-100 rounded text-amber-700">
                <ShieldAlert size={20} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                Investigator Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-slate-800">
              Active Cases
            </h2>
            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center space-x-2 text-xs font-medium bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <Database size={14} />
              <span>{isSeeding ? "Seeding..." : "Seed Demo Data"}</span>
            </button>
          </div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search cases..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all text-sm"
            />
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-slate-400"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <FileText size={48} className="mx-auto text-slate-300" />
            <p className="text-slate-500">No active cases found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {cases.map((c) => (
              <Link
                key={c.id}
                href={`/investigator/${c.id}`}
                className="group block"
              >
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {c.caseNumber}
                      </h3>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {c.status.toUpperCase()}
                      </span>
                      {c.isTemporary && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          TEMPORARY
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-slate-500 space-x-4">
                      <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>
                          Created{" "}
                          {formatDistanceToNow(new Date(c.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </span>
                      <span>ID: {c.id.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleDeleteCase(e, c.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                      title="Delete Case"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="p-2 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
