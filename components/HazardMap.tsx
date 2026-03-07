"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { formatDistanceToNow } from "date-fns";
import type { Statement } from "@/lib/db";

// Fix for default marker icons in Leaflet with Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom icons based on hazard category
const getIcon = (type: string, category?: string) => {
  let color = "gray";
  if (type === "crime") {
    color = "violet"; // Crime
  } else if (type === "hazard") {
    switch (category?.toLowerCase()) {
      case "fire": color = "red"; break;
      case "weather": color = "gold"; break;
      case "water": color = "blue"; break;
      case "traffic": color = "orange"; break;
      default: color = "grey"; break;
    }
  }

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export default function HazardMap({ statements }: { statements: Statement[] }) {
  // Montgomery, AL coordinates
  const defaultCenter: [number, number] = [32.3792, -86.3077];

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={12} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {statements.map((stmt) => {
        if (!stmt.location) return null;
        
        const category = stmt.structuredData?.hazardCategory || "Other";
        const title = stmt.type === "crime" ? "Crime/Suspicious Activity" : `Hazard: ${category.charAt(0).toUpperCase() + category.slice(1)}`;
        
        return (
          <Marker 
            key={stmt.id} 
            position={[stmt.location.lat, stmt.location.lng]}
            icon={getIcon(stmt.type, stmt.structuredData?.hazardCategory)}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{title}</h3>
                <p className="text-xs text-slate-500 mb-2">
                  Reported {formatDistanceToNow(new Date(stmt.createdAt), { addSuffix: true })}
                </p>
                <p className="text-xs text-slate-700 italic line-clamp-3">
                  &quot;{stmt.transcript}&quot;
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
