import { NextResponse } from "next/server";
import type { DetectionResponse } from "@/types/detection";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        {
          status: "error",
          message: "No image received from camera.",
        },
        { status: 400 }
      );
    }

    /*
      ==========================================================
      SPACE UNTUK INTEGRASI MODEL DEEP LEARNING
      ==========================================================

      Flow kamera:
      1. User membuka kamera di dashboard.
      2. User capture gambar.
      3. Gambar dikirim ke /api/detect.
      4. /api/detect mengirim image ke backend model.
      5. Backend mengembalikan hasil deteksi.

      Jika memakai FastAPI:

      const backendForm = new FormData();
      backendForm.append("image", image);

      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: backendForm,
      });

      const modelResult = await response.json();
      return NextResponse.json(modelResult);

      Format output backend:
      {
        "status": "success",
        "message": "Detection completed",
        "predictedClass": "Ripe",
        "confidence": 92.7,
        "detections": [...],
        "summary": {
          "underRipe": 1,
          "ripe": 3,
          "overRipe": 1
        }
      }
    */

    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result: DetectionResponse = {
      status: "success",
      message: "FFB grading completed successfully.",
      predictedClass: "Ripe",
      confidence: 92.7,
      detections: [
        {
          id: 1,
          label: "Ripe",
          confidence: 0.94,
          x: 24,
          y: 30,
          width: 18,
          height: 22,
        },
        {
          id: 2,
          label: "Ripe",
          confidence: 0.91,
          x: 48,
          y: 38,
          width: 17,
          height: 20,
        },
        {
          id: 3,
          label: "Ripe",
          confidence: 0.88,
          x: 38,
          y: 62,
          width: 16,
          height: 18,
        },
        {
          id: 4,
          label: "Under Ripe",
          confidence: 0.79,
          x: 67,
          y: 27,
          width: 15,
          height: 18,
        },
        {
          id: 5,
          label: "Over Ripe",
          confidence: 0.83,
          x: 70,
          y: 58,
          width: 17,
          height: 20,
        },
      ],
      summary: {
        underRipe: 1,
        ripe: 3,
        overRipe: 1,
      },
    };

    return NextResponse.json(result);
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