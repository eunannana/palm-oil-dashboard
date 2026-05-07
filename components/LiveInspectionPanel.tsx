"use client";

import {
  Camera,
  CameraOff,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  ScanLine,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  DetectionBox,
  DetectionResponse,
  RipenessClass,
} from "@/types/detection";
import MetricCard from "@/components/MetricCard";

type LiveInspectionPanelProps = {
  capturedImage: string | null;
  result: DetectionResponse | null;
  isLoading: boolean;
  isInspectionLocked: boolean;
  onCaptureAndDetect: (imageDataUrl: string, imageFile: File) => void;
  onReset: () => void;
};

const boxStyle: Record<
  RipenessClass,
  {
    border: string;
    badge: string;
  }
> = {
  "Under Ripe": {
    border: "border-emerald-500",
    badge: "bg-emerald-600",
  },
  Ripe: {
    border: "border-orange-500",
    badge: "bg-orange-500",
  },
  "Over Ripe": {
    border: "border-red-500",
    badge: "bg-red-600",
  },
};

function DetectionBoxOverlay({ box }: { box: DetectionBox }) {
  const style = boxStyle[box.label];

  return (
    <div
      className={`absolute border-2 ${style.border}`}
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.width}%`,
        height: `${box.height}%`,
      }}
    >
      <span
        className={`absolute -top-8 left-0 whitespace-nowrap rounded-lg px-2 py-1 text-xs font-black text-white ${style.badge}`}
      >
        {box.label} {(box.confidence * 100).toFixed(0)}%
      </span>
    </div>
  );
}

export default function LiveInspectionPanel({
  capturedImage,
  result,
  isLoading,
  isInspectionLocked,
  onCaptureAndDetect,
  onReset,
}: LiveInspectionPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (error) {
      console.error(error);
      setCameraError(
        "Camera access failed. Please allow camera permission in your browser."
      );
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      alert("Camera is not ready yet. Please wait a moment.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9)
    );

    if (!blob) return;

    const file = new File([blob], `ffb-inspection-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    stopCamera();
    onCaptureAndDetect(imageDataUrl, file);
  };

  const handleReset = () => {
    stopCamera();
    onReset();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Camera className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              FFB Camera Inspection
            </h2>
            <p className="text-sm text-slate-500">
              Open the camera, capture the FFB image, and save the grading
              result.
            </p>
          </div>
        </div>

        {isInspectionLocked && result && (
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Result Saved: {result.predictedClass} —{" "}
            {result.confidence.toFixed(1)}%
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950">
        {isInspectionLocked && capturedImage ? (
          <img
            src={capturedImage}
            alt="Saved FFB inspection result"
            className="h-[520px] w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-[520px] w-full object-cover"
          />
        )}

        {!isCameraActive && !isInspectionLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <CameraOff className="mx-auto mb-4 h-16 w-16 text-slate-500" />
              <p className="text-lg font-black text-white">
                Camera is not active
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Click open camera to start FFB inspection.
              </p>
            </div>
          </div>
        )}

        {isCameraActive && !isInspectionLocked && (
          <div className="absolute left-4 top-4 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-sm">
            CAMERA LIVE
          </div>
        )}

        {isInspectionLocked && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-sm">
            <CheckCircle2 className="h-4 w-4" />
            SAVED RESULT
          </div>
        )}

        {result?.detections.map((box) => (
          <DetectionBoxOverlay key={box.id} box={box} />
        ))}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
            <div className="text-center text-white">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-400" />
              <p className="font-black">Analyzing Captured Image...</p>
              <p className="mt-2 text-sm text-slate-300">
                Please wait while the model processes the FFB image.
              </p>
            </div>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraError && (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {cameraError}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {!isCameraActive && !isInspectionLocked ? (
          <button
            onClick={startCamera}
            className="rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white transition hover:bg-emerald-800"
          >
            Open Camera
          </button>
        ) : isCameraActive && !isInspectionLocked ? (
          <button
            onClick={captureFrame}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ScanLine className="h-5 w-5" />
            Capture & Save Result
          </button>
        ) : (
          <button
            disabled
            className="cursor-not-allowed rounded-2xl bg-emerald-100 px-5 py-4 font-black text-emerald-700"
          >
            Result Saved
          </button>
        )}

        {isCameraActive && !isInspectionLocked ? (
          <button
            onClick={stopCamera}
            className="rounded-2xl bg-slate-800 px-5 py-4 font-black text-white transition hover:bg-slate-900"
          >
            Close Camera
          </button>
        ) : (
          <button
            disabled
            className="cursor-not-allowed rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-400"
          >
            Close Camera
          </button>
        )}

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-700 transition hover:bg-slate-200"
        >
          <RefreshCcw className="h-5 w-5" />
          Reset for New Batch
        </button>
      </div>

      {result ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Final Grade"
              value={result.predictedClass}
              subtitle="Saved inspection class"
              variant="dark"
            />

            <MetricCard
              title="Confidence"
              value={`${result.confidence.toFixed(1)}%`}
              subtitle="Saved model confidence"
              variant="green"
            />

            <MetricCard
              title="Detected Objects"
              value={result.detections.length}
              subtitle="Total detected FFB areas"
              variant="orange"
            />

            <MetricCard
              title="Quality Status"
              value={
                result.confidence >= 90
                  ? "High"
                  : result.confidence >= 75
                  ? "Medium"
                  : "Low"
              }
              subtitle="Reliability level"
              variant="green"
            />
          </div>

          <div className="mt-5 rounded-[2rem] border border-slate-100 p-5">
            <h3 className="mb-4 text-lg font-black text-slate-900">
              Ripeness Distribution
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Under Ripe"
                value={result.summary.underRipe}
                subtitle="Detected under ripe areas"
                variant="green"
              />

              <MetricCard
                title="Ripe"
                value={result.summary.ripe}
                subtitle="Detected ripe areas"
                variant="orange"
              />

              <MetricCard
                title="Over Ripe"
                value={result.summary.overRipe}
                subtitle="Detected over ripe areas"
                variant="red"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
          Open the camera, position the FFB in view, then click{" "}
          <strong>Capture & Save Result</strong> to run detection and save the
          inspection result.
        </div>
      )}
    </section>
  );
}