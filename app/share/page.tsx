"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Share2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0 print:hidden">
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
              <div className="p-1.5 bg-blue-100 rounded text-blue-700">
                <Share2 size={20} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">QR Code</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white p-8 md:p-16 rounded-3xl shadow-xl border border-slate-200 text-center space-y-8 print:shadow-none print:border-none print:p-0">
          <div className="space-y-4">
            {/* City of Montgomery official badge */}
            <div className="flex flex-col items-center space-y-3 print:space-y-2">
              <div className="flex items-center justify-center w-20 h-20 rounded-full overflow-hidden shadow-lg shadow-amber-200 print:shadow-none">
                <Image
                  src="/images/montgomery_city_logo.jpeg"
                  alt="City of Montgomery logo"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.25em] uppercase text-amber-700">
                  City of Montgomery
                </p>
                <p className="text-xs text-slate-400 tracking-widest uppercase mt-0.5">
                  Alabama · Public Safety
                </p>
              </div>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent"></div>
            </div>

            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-indigo-900">
                SafeVoice
              </h1>
            </div>

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
              Print this code to create decals, posters, or flyers for your
              community.
            </p>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              <Printer size={24} />
              <span>Print QR code</span>
            </button>
          </div>

          {/* Print-only footer */}
          <p className="hidden print:block text-xs text-slate-400 mt-8 tracking-wide">
            An official service of the City of Montgomery, Alabama ·
            safetyreport.montgomery.gov (sample)
          </p>
        </div>
      </main>
      <footer className="text-center text-xs text-slate-400 py-4 print:hidden">
        © 2026 City of Montgomery, Alabama. All rights reserved.
      </footer>
    </div>
  );
}
