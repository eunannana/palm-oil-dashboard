"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import LiveInspectionPanel from "@/components/LiveInspectionPanel";
import DetectionResult from "@/components/DetectionResult";
import ReportPanel from "@/components/ReportPanel";
import Footer from "@/components/Footer";
import FileUpload from "@/components/FileUpload";
import type { DetectionResponse, FastApiDetectionBox, DetectionBox, RipenessClass } from "@/types/detection";

export default function HomePage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaking, setIsWaking] = useState(false);
  const [isApiWaking, setIsApiWaking] = useState(false);
  const [isInspectionLocked, setIsInspectionLocked] = useState(false);

  const [batchNumber, setBatchNumber] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");
  const [mode, setMode] = useState<"camera" | "upload">("camera");

  const handleCaptureAndDetect = async (
    imageDataUrl: string,
    imageFile: File
  ) => {
    let wakeTimer: ReturnType<typeof setTimeout> | null = null;
    try {
      setIsLoading(true);
      setIsWaking(false);
      wakeTimer = setTimeout(() => setIsWaking(true), 1500);
      setCapturedImage(imageDataUrl);

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("batchNumber", batchNumber);
      formData.append("inspectionDate", inspectionDate);
      formData.append("remarks", remarks);

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Detection failed.");
      }

      const data = (await response.json()) as DetectionResponse & {
        rawDetections?: FastApiDetectionBox[];
      };

      // If backend returned raw pixel bboxes but no annotated image, convert them
      // to percentage-based boxes using the uploaded image dimensions so overlays can render.
      if (data.rawDetections && !data.annotatedImage) {
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            const imgW = img.naturalWidth;
            const imgH = img.naturalHeight;

            const percentDetections: DetectionBox[] = data.rawDetections!.map((box, idx) => {
              const x1 = box.bbox.x1;
              const y1 = box.bbox.y1;
              const x2 = box.bbox.x2;
              const y2 = box.bbox.y2;

              const w = Math.max(1, x2 - x1);
              const h = Math.max(1, y2 - y1);

              const base = (data.detections?.[idx] || {}) as Partial<DetectionBox>;

              return {
                id: base.id ?? idx + 1,
                label: (base.label as RipenessClass) ?? "Ripe",
                confidence: base.confidence ?? box.confidence,
                x: (x1 / imgW) * 100,
                y: (y1 / imgH) * 100,
                width: (w / imgW) * 100,
                height: (h / imgH) * 100,
              };
            });

            const patched: DetectionResponse = {
              ...data,
              detections: percentDetections,
            };

            setResult(patched);
            setCapturedImage(imageDataUrl);
            // keep inspection locked state to follow previous semantics
            setIsInspectionLocked(true);

            resolve();
          };

          img.onerror = () => {
            // fallback: set raw response as-is
            setResult(data);
            setCapturedImage(imageDataUrl);
            setIsInspectionLocked(true);
            resolve();
          };

          img.src = imageDataUrl;
        });
      } else {
        setResult(data);
        setCapturedImage(imageDataUrl);
        setIsInspectionLocked(true);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to analyze FFB image. Please try again.");
      setIsInspectionLocked(false);
    } finally {
      setIsLoading(false);
      setIsWaking(false);
      if (wakeTimer) {
        clearTimeout(wakeTimer);
      }
    }
  };

  // --- File upload states and handlers ---
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleImageSelect = (file: File) => {
    setSelectedImageFile(file);

    try {
      if (previewUrl) {
        try {
          URL.revokeObjectURL(previewUrl);
        } catch {}
      }

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } catch {
      setPreviewUrl(null);
    }
  };

  const handleAnalyzeUpload = async () => {
    if (!selectedImageFile || !previewUrl) return;

    await handleCaptureAndDetect(previewUrl, selectedImageFile);
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setIsLoading(false);
    setIsInspectionLocked(false);
    setSelectedImageFile(null);
    if (previewUrl) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch {}
    }
    setPreviewUrl(null);

    setBatchNumber("");
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setRemarks("");
  };

  // Wake the FastAPI backend on initial page load (useful when backend sleeps)
  useEffect(() => {
    let mounted = true;

    const wake = async () => {
      try {
        setIsApiWaking(true);
        const resp = await fetch("/api/detect");
        if (!mounted) return;
        // we don't strictly need the body, but reading it may reveal errors
        await resp.json().catch(() => {});
      } catch (err) {
        // ignore - UI will stop showing waking after attempts
        console.error("Wake request failed:", err);
      } finally {
        if (mounted) setIsApiWaking(false);
      }
    };

    wake();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#f6faf7] text-slate-900">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-10 md:px-8 lg:px-10">
        {isApiWaking && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
            <div className="relative h-6 w-6">
              <span className="absolute inset-0 rounded-full border-2 border-amber-300/60" />
              <span className="loader-orbit absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent" />
            </div>
            <p>
              Waking backend model - initializing. This may take a few seconds.
              Please wait...
            </p>
          </div>
        )}

        {isLoading && isWaking && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
            <div className="relative h-6 w-6">
              <span className="absolute inset-0 rounded-full border-2 border-emerald-300/50" />
              <span className="loader-orbit absolute inset-0 rounded-full border-2 border-emerald-700 border-b-transparent" />
            </div>
            <p>
              Processing is taking longer than usual because the free backend is waking up. Detection is still running.
            </p>
          </div>
        )}
        {/* Kick off a backend wake on initial page load so uploads/capture are fast */}
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-sm font-bold text-slate-700">Mode:</label>
              <div className="inline-flex rounded-full bg-slate-100 p-1">
              <button
                onClick={() => setMode("camera")}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  mode === "camera"
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600"
                }`}
              >
                Camera
              </button>

              <button
                onClick={() => setMode("upload")}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  mode === "upload"
                    ? "bg-emerald-700 text-white"
                    : "text-slate-600"
                }`}
              >
                Upload
              </button>
            </div>
            </div>

            <div className="flex items-center">
              <button
                onClick={handleReset}
                className="rounded-2xl bg-slate-100 px-4 py-2 font-black text-slate-700 transition hover:bg-slate-200"
              >
                Reset for New Batch
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6">
            <div className="w-full">
              {mode === "camera" ? (
                <LiveInspectionPanel
                  capturedImage={capturedImage}
                  isLoading={isLoading}
                  isInspectionLocked={isInspectionLocked}
                  onCaptureAndDetect={handleCaptureAndDetect}
                />
              ) : (
                <FileUpload
                  selectedImage={selectedImageFile}
                  previewUrl={previewUrl}
                  isLoading={isLoading}
                  onImageSelect={handleImageSelect}
                  onAnalyze={handleAnalyzeUpload}
                />
              )}
            </div>

            <div className="w-full">
              <DetectionResult result={result} isLoading={isLoading} />
            </div>

            <div className="w-full">
              <ReportPanel
                result={result}
                capturedImage={capturedImage}
                batchNumber={batchNumber}
                inspectionDate={inspectionDate}
                remarks={remarks}
                onBatchNumberChange={setBatchNumber}
                onInspectionDateChange={setInspectionDate}
                onRemarksChange={setRemarks}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}