import { NextResponse } from "next/server";
import type {
  DetectionResponse,
  FastApiDetectionResponse,
  RipenessClass,
} from "@/types/detection";

const FASTAPI_PREDICT_URL =
  process.env.FASTAPI_PREDICT_URL ?? "http://localhost:8000/predict";

function normalizeClassName(className: string): RipenessClass {
  const normalized = className.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized === "under ripe" || normalized === "unripe") {
    return "Under Ripe";
  }

  if (normalized === "over ripe" || normalized === "overripe") {
    return "Over Ripe";
  }

  return "Ripe";
}

function pickPredictedClass(summary: DetectionResponse["summary"]): RipenessClass {
  const entries: Array<[RipenessClass, number]> = [
    ["Under Ripe", summary.underRipe],
    ["Ripe", summary.ripe],
    ["Over Ripe", summary.overRipe],
  ];

  entries.sort((first, second) => second[1] - first[1]);

  return entries[0]?.[0] ?? "Ripe";
}

function normalizeSummary(summary: Record<string, number>): DetectionResponse["summary"] {
  const result = {
    underRipe: 0,
    ripe: 0,
    overRipe: 0,
  };

  for (const [label, count] of Object.entries(summary)) {
    const normalized = normalizeClassName(label);

    if (normalized === "Under Ripe") {
      result.underRipe += count;
    } else if (normalized === "Over Ripe") {
      result.overRipe += count;
    } else {
      result.ripe += count;
    }
  }

  return result;
}

function normalizeBackendResponse(data: FastApiDetectionResponse): DetectionResponse {
  const summary = normalizeSummary(data.summary);
  const detections = data.detections.map((box, index) => ({
    id: index + 1,
    label: normalizeClassName(box.class_name),
    confidence: box.confidence,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  }));
  const confidence =
    detections.length > 0
      ? Math.max(...detections.map((item) => item.confidence)) * 100
      : 0;

  return {
    status: "success",
    message: "FFB grading completed successfully.",
    predictedClass: pickPredictedClass(summary),
    confidence,
    detections,
    summary,
    totalDetections: data.total_detections,
    annotatedImage: data.annotated_image,
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") ?? formData.get("file");

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        {
          status: "error",
          message: "No image received from camera.",
        },
        { status: 400 }
      );
    }

    const backendForm = new FormData();
    backendForm.append("file", image);

    const response = await fetch(FASTAPI_PREDICT_URL, {
      method: "POST",
      body: backendForm,
    });

    const payload = (await response.json()) as FastApiDetectionResponse | { error?: string };

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message:
            ("error" in payload && payload.error) ||
            "Failed to process image with FastAPI backend.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(normalizeBackendResponse(payload as FastApiDetectionResponse));
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process camera image.",
      },
      { status: 500 }
    );
  }
}