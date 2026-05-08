"use client";

import { Activity, CheckCircle2, ScanLine } from "lucide-react";
import Image from "next/image";
import type {
  DetectionBox,
  DetectionResponse,
  DetectionClass,
} from "@/types/detection";
import {
  DETECTION_CLASS_ORDER,
  formatDetectionClass,
} from "@/types/detection";
import MetricCard from "@/components/MetricCard";

type DetectionResultProps = {
  result: DetectionResponse | null;
  isLoading: boolean;
};

const boxStyle: Record<
  DetectionClass,
  {
    border: string;
    badge: string;
  }
> = {
  empty_bunch: {
    border: "border-slate-500",
    badge: "bg-slate-700",
  },
  overripe: {
    border: "border-red-500",
    badge: "bg-red-600",
  },
  ripe: {
    border: "border-emerald-500",
    badge: "bg-emerald-600",
  },
  underripe: {
    border: "border-amber-500",
    badge: "bg-amber-500",
  },
  unripe: {
    border: "border-lime-500",
    badge: "bg-lime-600",
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

export default function DetectionResult({
  result,
  isLoading,
}: DetectionResultProps) {
  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
            <ScanLine className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">
              Detection Result
            </h2>
            <p className="text-sm text-slate-500">
              Camera-based FFB grading output.
            </p>
          </div>
        </div>

        {result && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Detection Completed
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-slate-100">
        {result?.annotatedImage ? (
          <>
            <div className="relative h-[430px] w-full">
              <Image
                src={result.annotatedImage}
                alt="Captured FFB result"
                fill
                unoptimized
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {result?.detections.map((box) => (
              <DetectionBoxOverlay key={box.id} box={box} />
            ))}
          </>
        ) : isLoading ? (
          <div className="relative flex h-[430px] items-center justify-center overflow-hidden p-8 text-center">
            <div className="loader-scanline absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-emerald-300/20 via-emerald-300/10 to-transparent" />
            <div className="z-10">
              <div className="relative mx-auto mb-5 h-24 w-24">
                <span className="absolute inset-0 rounded-full border-2 border-emerald-300/40" />
                <span className="loader-orbit absolute inset-2 rounded-full border-2 border-emerald-500 border-l-transparent" />
                <span className="loader-orbit-slow absolute inset-5 rounded-full border-2 border-emerald-700/70 border-r-transparent" />
              </div>
              <p className="text-lg font-black text-slate-700">
                Processing detection result
              </p>
              <p className="mt-2 text-sm text-slate-500">
                The model is analyzing the FFB image. Results will appear automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-[430px] items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <Activity className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-700">
                No detection result yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Capture an image from camera and run detection.
              </p>
            </div>
          </div>
        )}
      </div>

      {result ? (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <MetricCard
              title="Final Grade"
              value={formatDetectionClass(result.predictedClass)}
              subtitle="Main predicted class"
              variant="dark"
            />

            <MetricCard
              title="Detection Confidence"
              value={`${result.confidence.toFixed(1)}%`}
              subtitle="Overall confidence"
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
              Class Distribution
            </h3>

            <div className="grid gap-4 md:grid-cols-5">
              {DETECTION_CLASS_ORDER.map((className) => {
                const variants: Record<DetectionClass, "dark" | "red" | "green" | "orange" | "lime"> = {
                  empty_bunch: "dark",
                  overripe: "red",
                  ripe: "green",
                  underripe: "orange",
                  unripe: "lime",
                };

                return (
                  <MetricCard
                    key={className}
                    title={formatDetectionClass(className)}
                    value={result.summary[className]}
                    subtitle="Detected class total"
                    variant={variants[className]}
                  />
                );
              })}
            </div>
          </div>
        </>
      ) : isLoading ? (
        <div className="mt-6 rounded-3xl bg-emerald-50 p-5 text-sm leading-relaxed text-emerald-900">
          Waiting for inference results from the server. This may take a little longer when the backend is busy.
        </div>
      ) : (
        <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-500">
          Detection result will appear here after the camera image is processed.
        </div>
      )}
    </section>
  );
}