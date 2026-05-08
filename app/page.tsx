"use client";

import { useState } from "react";
import Header from "@/components/Header";
import LiveInspectionPanel from "@/components/LiveInspectionPanel";
import ReportPanel from "@/components/ReportPanel";
import Footer from "@/components/Footer";
import type { DetectionResponse } from "@/types/detection";

export default function HomePage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInspectionLocked, setIsInspectionLocked] = useState(false);

  const [batchNumber, setBatchNumber] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [remarks, setRemarks] = useState("");

  const handleCaptureAndDetect = async (
    imageDataUrl: string,
    imageFile: File
  ) => {
    try {
      setIsLoading(true);
      setCapturedImage(imageDataUrl);

      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("batchNumber", batchNumber);
      formData.append("inspectionDate", inspectionDate);
      formData.append("remarks", remarks);

      const response = await fetch("/api/detect", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Detection failed.");
      }

      const data: DetectionResponse = await response.json();

      setResult(data);
      setCapturedImage(data.annotatedImage ?? imageDataUrl);
      setIsInspectionLocked(true);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze FFB image. Please try again.");
      setIsInspectionLocked(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setResult(null);
    setIsLoading(false);
    setIsInspectionLocked(false);

    setBatchNumber("");
    setInspectionDate(new Date().toISOString().split("T")[0]);
    setRemarks("");
  };

  return (
    <main className="min-h-screen bg-[#f6faf7] text-slate-900">
      <Header />

      <div className="mx-auto max-w-7xl px-4 pb-10 md:px-8 lg:px-10">
        <section className="mt-6">
          <LiveInspectionPanel
            capturedImage={capturedImage}
            result={result}
            isLoading={isLoading}
            isInspectionLocked={isInspectionLocked}
            onCaptureAndDetect={handleCaptureAndDetect}
            onReset={handleReset}
          />
        </section>

        <section className="mt-6">
          <ReportPanel
            result={result}
            capturedImage={capturedImage}
            batchNumber={batchNumber}
            inspectionDate={inspectionDate}
            remarks={remarks}
            onBatchNumberChange={setBatchNumber}
            onInspectionDateChange={setInspectionDate}
            onRemarksChange={setRemarks}
          />
        </section>
      </div>

      <Footer />
    </main>
  );
}