"use client";

import { useState } from "react";
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import DetectionResult from "@/components/DetectionResult";
import type { DetectionResponse } from "@/types/detection";
import { BarChart3, ShieldCheck, Timer } from "lucide-react";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Detection failed.");
      }

      const data: DetectionResponse = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <main className="min-h-screen bg-[#f6faf7] text-slate-900">
    <Header />

    <div className="mx-auto max-w-7xl px-4 pb-10 md:px-8 lg:px-10">
      {/* <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Ripeness Classification
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Classifies FFB into Under Ripe, Ripe, and Over Ripe categories.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Confidence-Based Output
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Displays detection percentage to support transparent grading
              interpretation.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Timer className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900">
              Fast Image Analysis
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Designed for quick image upload, automated detection, and visual
              result presentation.
            </p>
          </div>
        </section> */}

        <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
          <FileUpload
            selectedImage={selectedImage}
            previewUrl={previewUrl}
            isLoading={isLoading}
            onImageSelect={handleImageSelect}
            onAnalyze={handleAnalyze}
          />

          <DetectionResult previewUrl={previewUrl} result={result} />
        </section>

        {/* <section className="mt-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">
                Model Integration Space
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
                This dashboard is ready to be connected with a deep learning
                model through the API route. The current result is simulated and
                can be replaced with real inference output from YOLO, Faster
                R-CNN, EfficientDet, or another object detection model.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-700">
              API Ready: /api/detect
            </div>
          </div>
        </section> */}
      </div>

      <Footer />
    </main>
  );
}