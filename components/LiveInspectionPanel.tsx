"use client";

import {
  Camera,
  CameraOff,
  Loader2,
  ScanLine,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
type LiveInspectionPanelProps = {
  capturedImage: string | null;
  isLoading: boolean;
  isInspectionLocked: boolean;
  onCaptureAndDetect: (imageDataUrl: string, imageFile: File) => void;
};

export default function LiveInspectionPanel({
  capturedImage,
  isLoading,
  isInspectionLocked,
  onCaptureAndDetect,
}: LiveInspectionPanelProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );

  const startCamera = async (
    requestedFacingMode: "environment" | "user" = facingMode
  ) => {
    try {
      setCameraError(null);
      // Prefer a constrained request with facingMode, but fall back to a
      // permissive request if the browser/device rejects the constraint.
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: requestedFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err) {
        // fallback: try without facingMode (some browsers/devices reject the constraint)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      }

      streamRef.current = stream;

      // Ensure the video element is rendered first, then attach the stream.
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {
          /* ignore play errors; video should still render when allowed */
        });
      }

      setFacingMode(requestedFacingMode);
    } catch (error) {
      console.error(error);
      setCameraError(
        "Camera access failed. Please allow camera permission in your browser."
      );
    }
  };

  // When `isCameraActive` becomes true ensure the media stream is attached
  // to the video element. This covers the case where the video element was
  // not yet mounted when we started the camera.
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      videoRef.current.play().catch(() => {
        /* ignore play errors */
      });
    }
  }, [isCameraActive]);

  const switchCamera = async () => {
    const nextFacingMode = facingMode === "environment" ? "user" : "environment";

    stopCamera();
    await startCamera(nextFacingMode);
  };

  const stopCamera = () => {
    const stream = streamRef.current ?? (videoRef.current?.srcObject as MediaStream | null);

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    streamRef.current = null;

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

      </div>

      <div className="relative h-[520px] overflow-hidden rounded-[2rem] bg-slate-950">
          {isCameraActive && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}

          {!isCameraActive && capturedImage && isInspectionLocked ? (
            <img
              src={capturedImage}
              alt="Captured FFB image"
              className="absolute inset-0 h-full w-full object-contain"
            />
          ) : null}

          {!isCameraActive && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
              <div className="text-center">
                <CameraOff className="mx-auto mb-4 h-16 w-16 text-slate-500" />
                {isInspectionLocked ? (
                  <>
                    <p className="text-lg font-black text-white">
                      Result already saved
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Reopen the camera to inspect the next batch. The result stays in the Results section below.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-black text-white">
                      Camera is not active
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      Click open camera to start FFB inspection.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {isCameraActive && !isInspectionLocked && (
            <div className="absolute left-4 top-4 rounded-full bg-red-500 px-4 py-2 text-xs font-black text-white shadow-sm">
              CAMERA LIVE
            </div>
          )}

          {isCameraActive && (
            <button
              onClick={switchCamera}
              disabled={isLoading}
              className="absolute right-4 top-4 rounded-full bg-slate-900/85 px-4 py-2 text-xs font-black text-white shadow-sm backdrop-blur-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Switch Camera
            </button>
          )}

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

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {!isCameraActive ? (
          <button
            onClick={() => startCamera()}
            className="rounded-2xl bg-emerald-700 px-5 py-4 font-black text-white transition hover:bg-emerald-800"
          >
            {isInspectionLocked ? "Reopen Camera" : "Open Camera"}
          </button>
        ) : (
          <button
            onClick={captureFrame}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ScanLine className="h-5 w-5" />
            Capture & Save Result
          </button>
        )}

        {isCameraActive ? (
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
            Camera Idle
          </button>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
        Open the camera, position the FFB in view, then click{" "}
        <strong>Capture & Save Result</strong> to run detection. Saved results
        appear in the Results section below.
      </div>
    </section>
  );
}