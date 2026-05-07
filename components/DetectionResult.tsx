"use client";

import { Activity, CheckCircle2, ScanLine } from "lucide-react";
import type {
  DetectionBox,
  DetectionResponse,
  RipenessClass,
} from "@/types/detection";
import MetricCard from "@/components/MetricCard";

type DetectionResultProps = {
  previewUrl: string | null;
  result: DetectionResponse | null;
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

export default function DetectionResult({
  previewUrl,
  result,
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
              Grading Result
            </h2>
            <p className="text-sm text-slate-500">
              Detection output and ripeness distribution.
            </p>
          </div>
        </div>

        {result && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Analysis Completed
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-slate-100">
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="FFB detection preview"
              className="h-[430px] w-full object-cover"
            />

            {result?.detections.map((box) => (
              <DetectionBoxOverlay key={box.id} box={box} />
            ))}
          </>
        ) : (
          <div className="flex h-[430px] items-center justify-center p-8 text-center">
            <div>
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <Activity className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-lg font-black text-slate-700">
                No image analyzed yet
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Upload an FFB image and run analysis to view grading results.
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
              value={result.predictedClass}
              subtitle="Main predicted ripeness class"
              variant="dark"
            />

            <MetricCard
              title="Detection Confidence"
              value={`${result.confidence.toFixed(1)}%`}
              subtitle="Overall model confidence"
              variant="green"
            />

            <MetricCard
              title="Detected Objects"
              value={result.detections.length}
              subtitle="Total FFB regions detected"
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
              subtitle="Confidence reliability level"
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
                subtitle="Detected unripe FFB areas"
                variant="green"
              />

              <MetricCard
                title="Ripe"
                value={result.summary.ripe}
                subtitle="Detected optimal FFB areas"
                variant="orange"
              />

              <MetricCard
                title="Over Ripe"
                value={result.summary.overRipe}
                subtitle="Detected overripe FFB areas"
                variant="red"
              />
            </div>
          </div>
        </>
      ) : (
        <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-500">
          The grading result will appear here after the image is processed by
          the deep learning model.
        </div>
      )}
    </section>
  );
}