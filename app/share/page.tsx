"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Share2 } from "lucide-react";
import Link from "next/link";

export default function SharePage() {
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAppUrl(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 left-4 print:hidden">
        <Link
          href="/"
          className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors bg-white px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft size={20} />
          <span className="font-medium">Back to Home</span>
        </Link>
      </div>

      <div className="max-w-2xl w-full bg-white p-8 md:p-16 rounded-3xl shadow-xl border border-slate-200 text-center space-y-8 print:shadow-none print:border-none print:p-0">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 text-indigo-700 rounded-full mb-4 print:hidden">
            <Share2 size={40} />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-indigo-900">
            SafeVoice
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-lg mx-auto font-medium">
            Scan to access the anonymous reporting portal and hazard map.
          </p>
        </div>

        <div className="flex justify-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 print:border-none print:bg-white">
          {appUrl && (
            <QRCodeSVG
              value={appUrl}
              size={300}
              level="H"
              includeMargin={true}
              className="w-full max-w-[300px] h-auto"
            />
          )}
        </div>

        <div className="space-y-4 print:hidden">
          <p className="text-slate-500">
            Print this code to create decals, posters, or flyers for your community.
          </p>
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <Printer size={24} />
            <span>Print Poster / Decal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
