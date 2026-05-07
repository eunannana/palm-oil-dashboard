"use client";

import { ChangeEvent, DragEvent, useRef } from "react";
import { ImagePlus, UploadCloud, Zap } from "lucide-react";

type FileUploadProps = {
  selectedImage: File | null;
  previewUrl: string | null;
  isLoading: boolean;
  onImageSelect: (file: File) => void;
  onAnalyze: () => void;
};

export default function FileUpload({
  selectedImage,
  previewUrl,
  isLoading,
  onImageSelect,
  onAnalyze,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, JPEG, or PNG files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Maximum file size is 10MB.");
      return;
    }

    onImageSelect(file);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <UploadCloud className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900">Upload FFB Image</h2>
          <p className="text-sm text-slate-500">
            Add an image to start the grading process.
          </p>
        </div>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(event) => event.preventDefault()}
        className="flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleChange}
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Uploaded FFB"
            className="max-h-[320px] w-full rounded-3xl object-cover shadow-sm"
          />
        ) : (
          <>
            <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-sm">
              <ImagePlus className="h-12 w-12 text-emerald-700" />
            </div>

            <p className="text-lg font-black text-slate-800">
              Drag & drop FFB image here
            </p>
            <p className="mt-2 text-sm text-slate-500">or click to browse</p>

            <p className="mt-6 rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-400 shadow-sm">
              JPG, JPEG, PNG up to 10MB
            </p>
          </>
        )}
      </div>

      {selectedImage && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-700">Selected File</p>
          <p className="mt-1 truncate text-sm text-slate-500">
            {selectedImage.name}
          </p>
        </div>
      )}

      <button
        onClick={onAnalyze}
        disabled={!selectedImage || isLoading}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        <Zap className="h-5 w-5" />
        {isLoading ? "Analyzing FFB Image..." : "Analyze FFB Image"}
      </button>
    </section>
  );
}