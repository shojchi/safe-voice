"use client";

import { useState } from "react";
import { createNewCase } from "@/app/actions";
import { QRCodeSVG } from "qrcode.react";
import { Shield, ArrowLeft, Copy, CheckCircle2, Printer } from "lucide-react";
import Link from "next/link";

export default function OfficerDashboard() {
  const [caseNumber, setCaseNumber] = useState("");
  const [generatedCase, setGeneratedCase] = useState<{
    id: string;
    caseNumber: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseNumber.trim()) return;

    setIsSubmitting(true);
    try {
      const newCase = await createNewCase(caseNumber);
      setGeneratedCase(newCase);
    } catch (error) {
      console.error("Failed to create case:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const witnessUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/witness/${generatedCase?.id}`
      : "";

  const copyToClipboard = () => {
    if (witnessUrl) {
      navigator.clipboard.writeText(witnessUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
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
              <div className="p-1.5 bg-indigo-100 rounded text-indigo-700">
                <Shield size={20} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                Officer Dashboard
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">

        {!generatedCase ? (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-semibold mb-2">
              Generate Witness Link
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              Enter the CAD incident number to generate a secure, anonymous
              statement link for witnesses at the scene.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label
                  htmlFor="caseNumber"
                  className="block text-sm font-medium text-slate-700 mb-1"
                >
                  Case / Incident Number
                </label>
                <input
                  id="caseNumber"
                  type="text"
                  value={caseNumber}
                  onChange={(e) => setCaseNumber(e.target.value)}
                  placeholder="e.g. MPD-2023-001"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !caseNumber.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Generating..." : "Generate QR Code & Link"}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
            <div className="inline-flex items-center justify-center p-3 bg-emerald-100 text-emerald-700 rounded-full mb-2">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                Link Generated
              </h2>
              <p className="text-slate-500 mt-1">
                Case: {generatedCase.caseNumber}
              </p>
            </div>

            <div className="flex justify-center p-6 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex flex-col items-center space-y-4">
                <QRCodeSVG
                  value={witnessUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <button
                  onClick={handlePrint}
                  className="flex items-center space-x-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors print:hidden"
                >
                  <Printer size={16} />
                  <span>Print QR Code</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Witness URL (Expires in 4 hours)
              </p>
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                <input
                  type="text"
                  readOnly
                  value={witnessUrl}
                  className="flex-1 bg-transparent text-sm text-slate-600 outline-none px-2"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  title="Copy link"
                >
                  {copied ? (
                    <CheckCircle2 size={18} className="text-emerald-500" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setGeneratedCase(null);
                  setCaseNumber("");
                }}
                className="text-indigo-600 font-medium hover:text-indigo-800 transition-colors"
              >
                Generate another link
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
