import Link from "next/link";
import {
  Shield,
  Users,
  FileText,
  Megaphone,
  Map,
  Share2,
  ShieldAlert,
  Wind,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center space-y-3 print:space-y-2">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-200 print:shadow-none text-4xl">
              🏛️
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
          <h1 className="text-5xl font-bold tracking-tight text-indigo-900">
            SafeVoice
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Anonymous witness statement collection tool for law enforcement and
            communities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {/* Crime / Suspicious Activity */}
          <Link href="/report?type=crime" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <ShieldAlert size={32} />
              </div>
              <h2 className="text-xl font-semibold">
                Crime/Suspicious Activity
              </h2>
              <p className="text-sm text-slate-500">
                Report a crime or suspicious activity anonymously.
              </p>
            </div>
          </Link>

          {/* Hazard / Disaster */}
          <Link href="/report?type=hazard" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-50 rounded-full text-amber-600 group-hover:bg-amber-100 transition-colors">
                <Wind size={32} />
              </div>
              <h2 className="text-xl font-semibold">Hazard/Disaster</h2>
              <p className="text-sm text-slate-500">
                Report wildfires, dust storms, or pileups anonymously.
              </p>
            </div>
          </Link>

          {/* Hazard Map */}
          <Link href="/map" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-orange-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-orange-50 rounded-full text-orange-600 group-hover:bg-orange-100 transition-colors">
                <Map size={32} />
              </div>
              <h2 className="text-xl font-semibold">Hazard Map</h2>
              <p className="text-sm text-slate-500">
                Real-time dynamic map of public hazard and crime reports.
              </p>
            </div>
          </Link>

          {/* Investigator Persona */}
          <Link href="/investigator" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-amber-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-amber-50 rounded-full text-amber-600 group-hover:bg-amber-100 transition-colors">
                <FileText size={32} />
              </div>
              <h2 className="text-xl font-semibold">Investigator</h2>
              <p className="text-sm text-slate-500">
                Review AI-structured statements, credibility scores, and export
                to CAD.
              </p>
            </div>
          </Link>

          {/* Officer Persona */}
          <Link href="/officer" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Shield size={32} />
              </div>
              <h2 className="text-xl font-semibold">Patrol Officer</h2>
              <p className="text-sm text-slate-500">
                Generate secure, temporary QR codes at the scene to collect
                anonymous statements.
              </p>
            </div>
          </Link>

          {/* Share App / QR Code */}
          <Link href="/share" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Share2 size={32} />
              </div>
              <h2 className="text-xl font-semibold">QR Code</h2>
              <p className="text-sm text-slate-500">
                Print the QR code to share in your community.
              </p>
            </div>
          </Link>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-8 pb-4">
        © 2026 City of Montgomery, Alabama. All rights reserved.
      </p>
    </div>
  );
}
