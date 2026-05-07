"use client";

import { Camera, CameraOff, RefreshCcw, Loader2, Radio } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type CameraCaptureProps = {
  capturedImage: string | null;
  isLoading: boolean;
  isLiveDetecting: boolean;
  onStartLiveDetection: (imageDataUrl: string, imageFile: File) => void;
  onReset: () => void;
};

export default function CameraCapture({
  capturedImage,
  isLoading,
  isLiveDetecting,
  onStartLiveDetection,
  onReset,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const createFrameFile = async () => {
    if (!videoRef.current || !canvasRef.current) return null;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    if (!context) return null;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9)
    );

    if (!blob) return null;

    const file = new File([blob], `ffb-live-frame-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    return {
      imageDataUrl,
      file,
    };
  };

  const runLiveFrameDetection = async () => {
    if (isProcessingRef.current) return;

    try {
      isProcessingRef.current = true;

      const frame = await createFrameFile();

      if (!frame) return;

      onStartLiveDetection(frame.imageDataUrl, frame.file);
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  };

  const startLiveDetectionLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Deteksi pertama setelah kamera siap
    setTimeout(() => {
      runLiveFrameDetection();
    }, 800);

    // Deteksi otomatis setiap 2 detik
    intervalRef.current = setInterval(() => {
      runLiveFrameDetection();
    }, 2000);
  };

  const stopLiveDetectionLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    isProcessingRef.current = false;
  };

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
          startLiveDetectionLoop();
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
    stopLiveDetectionLoop();

    const stream = videoRef.current?.srcObject as MediaStream | null;

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  const handleReset = () => {
    stopCamera();
    onReset();
  };

  useEffect(() => {
    return () => {
      stopLiveDetectionLoop();

      const stream = videoRef.current?.srcObject as MediaStream | null;

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <Camera className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">
            Live Camera Inspection
          </h2>
          <p className="text-sm text-slate-500">
            Open the camera and the system will detect FFB ripeness
            automatically.
          </p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-[360px] w-full object-cover"
        />

        {!isCameraActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <CameraOff className="mx-auto mb-4 h-14 w-14 text-slate-500" />
              <p className="font-bold text-white">Camera is not active</p>
              <p className="mt-2 text-sm text-slate-400">
                Click open camera to start live FFB detection.
              </p>
            </div>
          </div>
        )}

        {isCameraActive && (
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-sm">
            <Radio className="h-4 w-4" />
            LIVE DETECTION
          </div>
        )}

        {isLoading && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-slate-950/80 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            Analyzing frame...
          </div>
        )}

        {capturedImage && (
          <div className="absolute bottom-4 left-4 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black text-white shadow-sm">
            Last frame saved for report
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {cameraError && (
        <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {cameraError}
        </div>
      )}

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {!isCameraActive ? (
          <button
            onClick={startCamera}
            className="rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white transition hover:bg-emerald-800"
          >
            Open Camera & Start Detection
          </button>
        ) : (
          <button
            onClick={stopCamera}
            className="rounded-2xl bg-slate-800 px-5 py-4 font-black text-white transition hover:bg-slate-900"
          >
            Stop Camera
          </button>
        )}

        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-4 font-black text-slate-700 transition hover:bg-slate-200"
        >
          <RefreshCcw className="h-5 w-5" />
          Reset Inspection
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
        {isLiveDetecting
          ? "Live detection is running. The result will update automatically every few seconds."
          : "Open the camera to start automatic FFB ripeness detection."}
      </div>
    </section>
  );
}