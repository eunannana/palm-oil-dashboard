import Image from "next/image";
import { Leaf, Sparkles, Cpu, Camera } from "lucide-react";

export default function Header() {
  return (
    <header className="relative overflow-hidden bg-[#f6faf7]">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-5 md:px-8 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-800 to-lime-700 px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lime-300/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl" />
          <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_32%)]" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-bold text-emerald-50 backdrop-blur sm:text-sm">
                <Sparkles className="h-4 w-4" />
                AI-Powered FFB Inspection
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur sm:h-16 sm:w-16">
                  <Leaf className="h-8 w-8 text-lime-200 sm:h-9 sm:w-9" />
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-6xl">
                    PalmGrade AI
                  </h1>
                  <p className="mt-1 text-sm font-semibold text-emerald-50 sm:text-base lg:text-lg">
                    Automated Fresh Fruit Bunch Grading System
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-sm leading-relaxed text-emerald-50/90 sm:text-base lg:text-lg">
                A camera-based AI dashboard for capturing Fresh Fruit Bunch
                images, detecting ripeness level, saving inspection results,
                and generating PDF grading reports.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <Camera className="mb-2 h-5 w-5 text-lime-200" />
                  <p className="text-sm font-bold">Camera Capture</p>
                  <p className="mt-1 text-xs text-emerald-50/80">
                    Direct FFB inspection
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <Cpu className="mb-2 h-5 w-5 text-lime-200" />
                  <p className="text-sm font-bold">AI Detection</p>
                  <p className="mt-1 text-xs text-emerald-50/80">
                    Ripeness grading
                  </p>
                </div>

                <div className="rounded-2xl bg-white/12 p-4 backdrop-blur">
                  <Sparkles className="mb-2 h-5 w-5 text-lime-200" />
                  <p className="text-sm font-bold">PDF Report</p>
                  <p className="mt-1 text-xs text-emerald-50/80">
                    Result documentation
                  </p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-4 rounded-full bg-lime-300/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 p-4 backdrop-blur">
                <Image
                  src="/logo.png"
                  alt="Palm oil AI grading illustration"
                  width={520}
                  height={420}
                  priority
                  className="h-[320px] w-full rounded-[1.5rem] object-cover opacity-90"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}