import { NextResponse } from "next/server";
import type {
  DetectionResponse,
  FastApiDetectionResponse,
  RipenessClass,
} from "@/types/detection";

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

    const imageBytes = await image.arrayBuffer();

    const buildBackendFormData = () => {
      const backendForm = new FormData();
      const blob = new Blob([imageBytes], {
        type: image.type || "application/octet-stream",
      });

      backendForm.append("file", blob, image.name || "capture.jpg");
      return backendForm;
    };

    // try immediate predict first
    try {
      const response = await fetch(FASTAPI_PREDICT_URL, {
        method: "POST",
        body: buildBackendFormData(),
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

      // Poll predict endpoint a few times with backoff
      const maxRetries = 6;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const delayMs = 1000 * attempt; // 1s, 2s, 3s...
        await sleep(delayMs);

        try {
          const response = await fetch(FASTAPI_PREDICT_URL, {
            method: "POST",
            body: buildBackendFormData(),
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
            "Backend is currently unreachable. We attempted to wake it but did not receive a response. Try again in a few seconds.",
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

export async function GET(request: Request) {
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