import { NextResponse } from "next/server";
import type {
  DetectionResponse,
  FastApiDetectionResponse,
  DetectionClass,
} from "@/types/detection";
import { DETECTION_CLASS_ORDER } from "@/types/detection";

function normalizeBackendUrl(url: string): string {
  const trimmed = url.trim();

  if (/^http:\/\/(?!localhost|127\.0\.0\.1)/i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  return trimmed;
}

const FASTAPI_PREDICT_URL = normalizeBackendUrl(
  process.env.FASTAPI_PREDICT_URL ?? "http://localhost:8000/predict"
);
const FASTAPI_ROOT_URL = normalizeBackendUrl(
  process.env.FASTAPI_ROOT_URL ?? FASTAPI_PREDICT_URL.replace(/\/predict\/?$/i, "")
);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeClassName(className: string): DetectionClass {
  const normalized = className.toLowerCase().replace(/\s+/g, " ").trim();

  if (normalized === "empty bunch" || normalized === "empty_bunch") {
    return "empty_bunch";
  }

  if (normalized === "over ripe" || normalized === "overripe") {
    return "overripe";
  }

  if (normalized === "under ripe" || normalized === "underripe") {
    return "underripe";
  }

  if (normalized === "unripe") {
    return "unripe";
  }

  return "ripe";
}

function pickPredictedClass(summary: DetectionResponse["summary"]): DetectionClass {
  const entries = DETECTION_CLASS_ORDER.map(
    (className) => [className, summary[className]] as const
  );

  entries.sort((first, second) => second[1] - first[1]);

  return entries[0]?.[0] ?? "Ripe";
}

function normalizeSummary(summary: Record<string, number>): DetectionResponse["summary"] {
  const result = {
    empty_bunch: 0,
    overripe: 0,
    ripe: 0,
    underripe: 0,
    unripe: 0,
  };

  for (const [label, count] of Object.entries(summary)) {
    const normalized = normalizeClassName(label);

    result[normalized] += count;
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

    const imageBytes = await image.arrayBuffer();

    const buildBackendFormData = () => {
      const backendForm = new FormData();
      const blob = new Blob([imageBytes], {
        type: image.type || "application/octet-stream",
      });

      backendForm.append("file", blob, image.name || "capture.jpg");
      return backendForm;
    };

    // try immediate predict first with 30s timeout
    try {
      const response = await fetch(FASTAPI_PREDICT_URL, {
        method: "POST",
        body: buildBackendFormData(),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        // if server returned 5xx, attempt wake and retry below
        throw new Error(`FastAPI returned status ${response.status}`);
      }

      const payload = (await response.json()) as FastApiDetectionResponse;

      const normalized = normalizeBackendResponse(payload);
      return NextResponse.json({ ...normalized, rawDetections: payload.detections });
    } catch {
      // Try to wake the backend (useful for free hosting that sleeps)
      try {
        await fetch(FASTAPI_ROOT_URL, { method: "GET" });
      } catch {
        // ignore - waking may still happen at host level
      }

      // Poll predict endpoint with extended backoff for free-tier backends that may sleep
      // Each retry waits incrementally (1s, 2s, 3s...) then attempts with 20s timeout
      // Total wait time: up to ~140s (21s delays + 6*20s timeouts) = ~2.3 minutes
      const maxRetries = 6;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const delayMs = 1000 * attempt; // 1s, 2s, 3s, 4s, 5s, 6s
        await sleep(delayMs);

        try {
          const response = await fetch(FASTAPI_PREDICT_URL, {
            method: "POST",
            body: buildBackendFormData(),
            signal: AbortSignal.timeout(20000), // 20s per request
          });

          if (!response.ok) {
            continue;
          }

          const payload = (await response.json()) as FastApiDetectionResponse;
          const normalized = normalizeBackendResponse(payload);
          return NextResponse.json({ ...normalized, rawDetections: payload.detections });
        } catch {
          // continue retrying
          continue;
        }
      }

      return NextResponse.json(
        {
          status: "error",
          message:
            "Backend is still loading and did not respond after multiple attempts (waited ~140s). The free-tier backend may be experiencing heavy load. Please try again in a moment.",
        },
        { status: 502 }
      );
    }
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

export async function GET() {
  // Lightweight wake endpoint: try to hit the root URL and wait until the
  // backend responds or we exhaust retries. This lets the frontend show a
  // loading indicator while a sleeping free-hosted backend wakes up.
  try {
    // try an immediate GET to the root
    try {
      const resp = await fetch(FASTAPI_ROOT_URL, { method: "GET" });
      if (resp.ok) {
        return NextResponse.json({ status: "ready" });
      }
    } catch {
      // ignore immediate failure and continue to polling
    }

    // poll the root URL with backoff
    const maxRetries = 6;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delayMs = 1000 * attempt;
      await sleep(delayMs);

      try {
        const resp = await fetch(FASTAPI_ROOT_URL, { method: "GET" });
        if (resp.ok) {
          return NextResponse.json({ status: "ready", attempts: attempt });
        }
      } catch {
        // continue
      }
    }

    return NextResponse.json(
      { status: "error", message: "Backend did not respond after wake attempts." },
      { status: 502 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Wake attempt failed." }, { status: 500 });
  }
}