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
          message: "No image uploaded.",
        },
        { status: 400 }
      );
    }

    /*
      ==========================================================
      SPACE UNTUK INTEGRASI MODEL DEEP LEARNING
      ==========================================================

      Saat ini bagian ini masih dummy/simulasi.

      Nanti kalau model deep learning kamu sudah siap, kamu bisa
      ganti bagian dummy result di bawah dengan pemanggilan ke
      backend Python/FastAPI.

      Contoh jika memakai FastAPI:

      const backendForm = new FormData();
      backendForm.append("image", image);

      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: backendForm,
      });

      const modelResult = await response.json();
      return NextResponse.json(modelResult);

      Backend FastAPI nanti sebaiknya mengembalikan JSON dengan format:
      {
        predictedClass: "Ripe",
        confidence: 92.7,
        detections: [...],
        summary: {...}
      }

      Kalau model kamu YOLO, hasil bounding box dari YOLO bisa langsung
      dikonversi ke format x, y, width, height dalam persen.
    */

    await new Promise((resolve) => setTimeout(resolve, 1200));

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
          x: 25,
          y: 32,
          width: 18,
          height: 22,
        },
        {
          id: 2,
          label: "Ripe",
          confidence: 0.91,
          x: 48,
          y: 40,
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
          x: 68,
          y: 28,
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
        message: "Failed to process image.",
      },
      { status: 500 }
    );
  }
}