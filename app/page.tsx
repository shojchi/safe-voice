import Link from "next/link";
import { Shield, Users, FileText, Megaphone, Map, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-indigo-900">
            SafeVoice
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Anonymous witness statement collection tool for law enforcement and
            communities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {/* Public Report Portal */}
          <Link href="/report" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-red-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-red-50 rounded-full text-red-600 group-hover:bg-red-100 transition-colors">
                <Megaphone size={32} />
              </div>
              <h2 className="text-xl font-semibold">Public Portal</h2>
              <p className="text-sm text-slate-500">
                Anonymous crime and hazard reporting for the public.
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

          {/* Officer Persona */}
          <Link href="/officer" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-indigo-50 rounded-full text-indigo-600 group-hover:bg-indigo-100 transition-colors">
                <Shield size={32} />
              </div>
              <h2 className="text-xl font-semibold">Patrol Officer</h2>
              <p className="text-sm text-slate-500">
                Generate secure, temporary QR codes at the scene to collect
                anonymous statements.
              </p>
            </div>
          </Link>

          {/* Witness Persona */}
          <Link href="/witness" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                <Users size={32} />
              </div>
              <h2 className="text-xl font-semibold">Witness</h2>
              <p className="text-sm text-slate-500">
                Safely and anonymously record what you saw without talking to
                police directly.
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

          {/* Share App / Community Poster */}
          <Link href="/share" className="group block h-full">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all h-full flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Share2 size={32} />
              </div>
              <h2 className="text-xl font-semibold">Community Poster</h2>
              <p className="text-sm text-slate-500">
                Generate and print a generic QR code to share the app with the community.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
