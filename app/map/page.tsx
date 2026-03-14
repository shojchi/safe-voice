"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, Clock, MapPin, ShieldAlert, Wind, AlertTriangle, Droplets, Car } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Statement } from "@/lib/db";

// Dynamically import the map component to avoid SSR issues with Leaflet
const HazardMap = dynamic(() => import("@/components/HazardMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
      Loading map...
    </div>
  ),
});

type Timeframe = "30m" | "1h" | "3h" | "5h" | "12h" | "24h";

export default function MapPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>("24h");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      // In a real app, this would be an API call
      // For MVP, we'll use a server action or API route. Let's create an API route or just use a server action.
      // Wait, we can't easily poll a server action from client component without importing it.
      // Let's create an API route for polling, or just use a server action.
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setStatements(data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Poll every 10 seconds
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const getFilteredStatements = () => {
    const now = Date.now();
    const msMap: Record<Timeframe, number> = {
      "30m": 30 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "3h": 3 * 60 * 60 * 1000,
      "5h": 5 * 60 * 60 * 1000,
      "12h": 12 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
    };

    const maxAge = msMap[timeframe];
    return statements.filter((stmt) => {
      if (!stmt.location) return false;
      const age = now - new Date(stmt.createdAt).getTime();
      return age <= maxAge;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const filteredStatements = getFilteredStatements();

  const getIconForType = (type: string, category?: string) => {
    if (type === "crime") return <ShieldAlert size={16} className="text-indigo-600" />;
    switch (category?.toLowerCase()) {
      case "fire": return <AlertTriangle size={16} className="text-red-600" />;
      case "weather": return <Wind size={16} className="text-amber-500" />;
      case "water": return <Droplets size={16} className="text-blue-600" />;
      case "traffic": return <Car size={16} className="text-orange-600" />;
      default: return <AlertTriangle size={16} className="text-slate-600" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shrink-0">
        <div className="px-4 sm:px-6 lg:px-8 min-h-[4rem] py-2 flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/"
              className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="h-6 w-px bg-slate-200 shrink-0 hidden sm:block"></div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 bg-orange-100 rounded text-orange-700 shrink-0">
                <MapPin size={20} />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                Live Hazard Map
              </h1>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center shrink-0 ml-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-[5px] text-center">
              Last
            </span>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as Timeframe)}
              className="bg-slate-100 border-none text-xs sm:text-sm font-medium rounded-md px-2 py-1 sm:px-3 sm:py-1.5 focus:ring-2 focus:ring-orange-500 outline-none text-center cursor-pointer"
            >
              <option value="30m">30 Min</option>
              <option value="1h">1 Hour</option>
              <option value="3h">3 Hours</option>
              <option value="5h">5 Hours</option>
              <option value="12h">12 Hours</option>
              <option value="24h">24 Hours</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Content Split */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar - List of Reports */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col overflow-hidden flex-1 md:flex-none">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h2 className="font-semibold text-slate-800">Recent Reports</h2>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
              {filteredStatements.length}
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
              </div>
            ) : filteredStatements.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No reports found in the selected timeframe.
              </div>
            ) : (
              filteredStatements.map((stmt) => (
                <div key={stmt.id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-orange-300 transition-colors cursor-pointer">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
                    <div className="flex items-center space-x-2">
                      {getIconForType(stmt.type, stmt.structuredData?.hazardCategory)}
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {stmt.type === "crime" ? "Crime" : stmt.structuredData?.hazardCategory || "Hazard"}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 flex items-center whitespace-nowrap">
                      <Clock size={12} className="mr-1 shrink-0" />
                      {formatDistanceToNow(new Date(stmt.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 line-clamp-3 italic">
                    &quot;{stmt.transcript}&quot;
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Area - Map */}
        <div className="flex-1 relative bg-slate-100 min-h-[50vh] md:min-h-0">
          <HazardMap statements={filteredStatements} />
          
          {/* Legend Overlay */}
          <div className="absolute bottom-6 right-6 z-[400] bg-white/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-200 pointer-events-none hidden sm:block">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Legend</h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Fire / Wildfire</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-amber-400"></div><span>Weather / Dust</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Flood / Water</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Traffic / Accident</span></div>
              <div className="flex items-center space-x-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div><span>Crime / Suspicious</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
