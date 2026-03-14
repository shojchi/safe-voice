"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Mic,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldAlert,
  Users,
  User,
} from "lucide-react";
import { saveStatement } from "@/app/actions";
import { GoogleGenAI, Type } from "@google/genai";
import Link from "next/link";

export default function WitnessRecording() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.caseId as string;

  const [anonymityChoice, setAnonymityChoice] = useState<
    "pending" | "anonymous" | "identified"
  >("pending");
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: "", phone: "" });

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

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (MediaRecorder.isTypeSupported("audio/webm")) {
          mimeType = "audio/webm";
        } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
          mimeType = "audio/mp4";
        } else if (MediaRecorder.isTypeSupported("audio/aac")) {
          mimeType = "audio/aac";
        } else {
          mimeType = ""; // Let the browser decide
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType,
        });
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
      setError(
        "Could not access microphone. Please ensure permissions are granted.",
      );
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
      const cleanMimeType = audioBlob.type.split(";")[0] || "audio/webm";

      const apiKey =
        process.env.NEXT_PUBLIC_USER_GEMINI_API_KEY ||
        process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      console.log(
        "API Key starts with:",
        apiKey ? apiKey.substring(0, 5) : "undefined",
      );
      if (!apiKey) {
        throw new Error("API key is missing");
      }
      const ai = new GoogleGenAI({ apiKey });

      // Model fallback chain: try preview first, then stable GA model
      const promptText = `You are an expert police investigator. Analyze this ${anonymityChoice === "anonymous" ? "anonymous " : ""}witness audio statement.
            ${anonymityChoice === "identified" ? `The witness provided their contact info: Name: ${contactInfo.name}, Phone: ${contactInfo.phone}.` : ""}
            1. Provide a full transcript.
            2. Extract structured data: suspect description, vehicle description, timeline, location details, and any unique details.
            3. Evaluate credibility (0-100) based on specificity, clarity, and internal consistency.
            4. Categorize the incidentType as one of: "Vehicle Crash", "Violence / Assault", "Theft / Burglary", "Gunshot", "Suspicious Activity", "Fire / Hazard", "Road Blockage", "Other".
            5. Provide a shortTitle (1-3 words) and a humanReadableLocation (e.g., "Main St & 4th Ave").
            
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
            }
            `;

      const responseSchema = {
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
              uniqueDetails: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              incidentType: {
                type: Type.STRING,
                description:
                  "One of: Vehicle Crash, Violence / Assault, Theft / Burglary, Gunshot, Suspicious Activity, Fire / Hazard, Road Blockage, Other",
              },
              shortTitle: {
                type: Type.STRING,
                description: "1-3 word specific title of the incident",
              },
              humanReadableLocation: {
                type: Type.STRING,
                description:
                  "Concise street or intersection name based on the transcript",
              },
            },
          },
          credibilityScore: { type: Type.NUMBER },
          corroboratedDetails: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          conflictingDetails: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      };

      // Add a 60-second timeout to prevent infinite hangs
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error("API call timed out after 60 seconds");
        controller.abort();
      }, 60000);

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
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
            abortSignal: controller.signal,
          },
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const resultText = response.text || "{}";
      let result;
      try {
        result = JSON.parse(resultText);
      } catch (e) {
        console.error("JSON parse error:", e, resultText);
        throw new Error("Failed to parse AI response");
      }

      const saveResult = await saveStatement(
        caseId,
        "crime",
        undefined,
        result.transcript || "No transcript available.",
        {
          ...(result.structuredData || {
            suspectDescription: "",
            vehicleDescription: "",
            timeline: "",
            locationDetails: "",
            uniqueDetails: [],
          }),
          isAnonymous: anonymityChoice === "anonymous",
          reporterName: contactInfo.name || undefined,
          reporterPhone: contactInfo.phone || undefined,
        },
        result.credibilityScore || 50,
        result.corroboratedDetails || [],
        result.conflictingDetails || [],
      );

      if (saveResult.success) {
        setIsSuccess(true);
      } else {
        setError(saveResult.error || "Failed to save statement.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(
        err.message || "An unexpected error occurred during submission.",
      );
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
          <h1 className="text-2xl font-bold text-slate-800">
            Statement Submitted
          </h1>
          <p className="text-slate-500">
            Thank you for your help. Your statement has been securely processed
            and sent to investigators.
          </p>
          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={() => router.push("/")}
              className="text-emerald-600 font-medium hover:text-emerald-800 transition-colors cursor-pointer"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (anonymityChoice === "pending" && !showContactForm) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-indigo-100 rounded text-indigo-700">
                  <ShieldAlert size={20} />
                </div>
                <h1 className="text-lg font-bold text-slate-800">
                  Submit a Statement
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-800">
                How would you like to report?
              </h2>
              <p className="text-slate-500">
                Choose whether to provide your contact information or remain
                anonymous.
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => setAnonymityChoice("anonymous")}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center space-x-4 text-left group cursor-pointer"
              >
                <div className="p-4 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-200 transition-colors">
                  <ShieldAlert size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Report Anonymously
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Your identity will be completely hidden.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowContactForm(true)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all flex items-center space-x-4 text-left group cursor-pointer"
              >
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <User size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Provide My Details
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Share your contact info so investigators can follow up.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (showContactForm) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowContactForm(false)}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-indigo-100 rounded text-indigo-700">
                  <User size={20} />
                </div>
                <h1 className="text-lg font-bold text-slate-800">
                  Contact Information
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">
                Your Details
              </h2>
              <p className="text-slate-500 text-sm">
                Please provide your contact information.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAnonymityChoice("identified");
                setShowContactForm(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={contactInfo.name}
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={contactInfo.phone}
                  onChange={(e) =>
                    setContactInfo({ ...contactInfo, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Continue to Record
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAnonymityChoice("pending")}
              className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-indigo-100 rounded text-indigo-700">
                <ShieldAlert size={20} />
              </div>
              <h1 className="text-lg font-bold text-slate-800">
                {anonymityChoice === "anonymous"
                  ? "Anonymous Statement"
                  : "Statement"}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">
              Record Statement
            </h2>
            <p className="text-slate-500 text-sm">
              Case ID:{" "}
              <span className="font-mono bg-slate-100 px-2 py-1 rounded">
                {caseId}
              </span>
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
                className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 cursor-pointer"
              >
                <Mic size={32} />
              </button>
            ) : isRecording ? (
              <button
                onClick={stopRecording}
                className="w-20 h-20 bg-slate-800 hover:bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-105 animate-pulse cursor-pointer"
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
                    className="flex-1 py-2 px-4 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                    disabled={isSubmitting}
                  >
                    Retake
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
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

          <div className="text-xs text-slate-400 text-center">
            <p>
              {anonymityChoice === "anonymous"
                ? "Your statement is completely anonymous."
                : "Your contact info will be included with this statement."}
            </p>
            <p>This is not a sworn testimony, but an investigative lead.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
