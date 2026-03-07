"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mic, Square, Loader2, CheckCircle2, AlertCircle, ShieldAlert, Wind, ArrowLeft } from "lucide-react";
import { saveStatement } from "@/app/actions";
import { GoogleGenAI, Type } from "@google/genai";

export default function UniversalReport() {
  const router = useRouter();
  const [mode, setMode] = useState<"select" | "crime" | "hazard">("select");
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>();
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleModeSelect = (selectedMode: "crime" | "hazard") => {
    setMode(selectedMode);
    if (selectedMode === "hazard") {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (err) => {
            console.warn("Geolocation denied or failed:", err);
          }
        );
      }
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let mimeType = 'audio/webm';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        } else {
          mimeType = '';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please ensure permissions are granted.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const cleanMimeType = audioBlob.type.split(';')[0] || "audio/webm";

      const apiKey = process.env.NEXT_PUBLIC_USER_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("API key is missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      let promptText = "";
      let responseSchema: any = {};

      if (mode === "crime") {
        promptText = `You are an expert police investigator. Analyze this anonymous witness audio statement.
        1. Provide a full transcript.
        2. Extract structured data: suspect description, vehicle description, timeline, location details, and any unique details.
        3. Evaluate credibility (0-100) based on specificity, clarity, and internal consistency.
        
        Return JSON matching this schema:
        {
          "transcript": "Full text of what was said",
          "structuredData": {
            "suspectDescription": "...",
            "vehicleDescription": "...",
            "timeline": "...",
            "locationDetails": "...",
            "uniqueDetails": ["..."]
          },
          "credibilityScore": 85,
          "corroboratedDetails": ["..."],
          "conflictingDetails": ["..."]
        }`;
        
        responseSchema = {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            structuredData: {
              type: Type.OBJECT,
              properties: {
                suspectDescription: { type: Type.STRING },
                vehicleDescription: { type: Type.STRING },
                timeline: { type: Type.STRING },
                locationDetails: { type: Type.STRING },
                uniqueDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
            },
            credibilityScore: { type: Type.NUMBER },
            corroboratedDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflictingDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        };
      } else {
        promptText = `You are an expert incident commander. Analyze this anonymous hazard/disaster audio statement.
        1. Provide a full transcript.
        2. Extract structured data: hazardCategory (one of: "fire", "weather", "water", "traffic", "other"), fire direction, wind speed/direction, trapped individuals, road blockages, and visibility.
        3. Evaluate credibility (0-100) based on specificity, clarity, and internal consistency.
        
        Return JSON matching this schema:
        {
          "transcript": "Full text of what was said",
          "structuredData": {
            "hazardCategory": "...",
            "fireDirection": "...",
            "windSpeed": "...",
            "trappedIndividuals": "...",
            "roadBlockages": "...",
            "visibility": "..."
          },
          "credibilityScore": 85,
          "corroboratedDetails": ["..."],
          "conflictingDetails": ["..."]
        }`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            transcript: { type: Type.STRING },
            structuredData: {
              type: Type.OBJECT,
              properties: {
                hazardCategory: { type: Type.STRING, description: "Must be one of: fire, weather, water, traffic, other" },
                fireDirection: { type: Type.STRING },
                windSpeed: { type: Type.STRING },
                trappedIndividuals: { type: Type.STRING },
                roadBlockages: { type: Type.STRING },
                visibility: { type: Type.STRING },
              },
            },
            credibilityScore: { type: Type.NUMBER },
            corroboratedDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflictingDetails: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
        };
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            inlineData: {
              mimeType: cleanMimeType,
              data: base64Audio,
            },
          },
          { text: promptText },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      const resultText = response.text || "{}";
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        console.error("JSON parse error:", e, resultText);
        throw new Error("Failed to parse AI response");
      }

      const saveResult = await saveStatement(
        "public-reports", // Default case ID for public decal reports
        mode as "crime" | "hazard",
        location,
        result.transcript || "No transcript available.",
        result.structuredData || {},
        result.credibilityScore || 50,
        result.corroboratedDetails || [],
        result.conflictingDetails || []
      );

      if (saveResult.success) {
        setIsSuccess(true);
      } else {
        setError(saveResult.error || "Failed to save statement.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-6">
          <div className="inline-flex items-center justify-center p-4 bg-emerald-100 text-emerald-700 rounded-full mb-2">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Report Submitted</h1>
          <p className="text-slate-500">
            Thank you. Your anonymous report has been securely processed and sent to the command center.
          </p>
          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={() => {
                setIsSuccess(false);
                setMode("select");
                setAudioUrl(null);
                setAudioBlob(null);
              }}
              className="text-emerald-600 font-medium hover:text-emerald-800 transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "select") {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center space-x-2 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-800">Public Report Portal</h1>
            <p className="text-slate-500">What are you reporting today?</p>
          </div>

          <div className="grid gap-4">
            <button
              onClick={() => handleModeSelect("crime")}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center space-x-4 text-left group"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <ShieldAlert size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Crime / Suspicious Activity</h2>
                <p className="text-sm text-slate-500 mt-1">Report a crime anonymously. We will extract suspect and vehicle details.</p>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect("hazard")}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex items-center space-x-4 text-left group"
            >
              <div className="p-4 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                <Wind size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Hazard / Disaster</h2>
                <p className="text-sm text-slate-500 mt-1">Report wildfires, dust storms, or pileups. We will request your location.</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === "crime" ? "Anonymous Crime Report" : "Hazard / Disaster Report"}
          </h1>
          <p className="text-slate-500 text-sm">
            {mode === "crime" 
              ? "Your identity is hidden. Please describe what you saw."
              : "Please describe the hazard, visibility, and any trapped individuals."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start space-x-3 text-sm">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex flex-col items-center space-y-6">
          <div className="text-3xl font-mono text-slate-700 tracking-wider">
            {formatTime(recordingTime)}
          </div>

          {!audioUrl && !isRecording ? (
            <button
              onClick={startRecording}
              className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105"
            >
              <Mic size={32} />
            </button>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="w-20 h-20 bg-slate-800 hover:bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 animate-pulse"
            >
              <Square size={24} className="fill-current" />
            </button>
          ) : (
            <div className="w-full space-y-4">
              <audio src={audioUrl!} controls className="w-full" />
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setAudioUrl(null);
                    setAudioBlob(null);
                    setRecordingTime(0);
                  }}
                  className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Retake
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
              </div>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center max-w-xs">
            {isRecording
              ? "Recording in progress. Speak clearly."
              : "Tap the microphone to start recording your statement."}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            onClick={() => setMode("select")}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  );
}