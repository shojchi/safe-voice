"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
            <Users size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            Submit a Statement
          </h1>
          <p className="text-slate-500 text-sm">
            Your identity is protected. We do not collect your name, phone
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>Continue</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="text-center pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
