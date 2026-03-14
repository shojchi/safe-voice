"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowRight, ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function WitnessEntry() {
  const [caseId, setCaseId] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caseId.trim()) {
      router.push(`/witness/${caseId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-emerald-100 rounded text-emerald-700">
                <Users size={20} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                Submit a Statement
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
              Submit a Statement
            </h2>
            <p className="text-slate-500 text-sm">
              Your statement is anonymous. We do not collect your name, phone
              number, or location.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="caseId"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Enter Case ID or Link Code
              </label>
              <input
                id="caseId"
                type="text"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="e.g. case-123"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={!caseId.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
