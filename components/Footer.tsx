export default function Footer() {
  return (
    <footer className="mt-10 border-t border-emerald-100 bg-white/70">
      <div className="mx-auto max-w-7xl px-4 py-8 text-center md:px-8 lg:px-10">
        <p className="text-sm font-semibold text-slate-600">
          © 2026 UMPSA. All rights reserved.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Contact:{" "}
          <a
            href="mailto:kamarul@umpsa.edu.my"
            className="font-semibold text-emerald-700 hover:text-emerald-900"
          >
            kamarul@umpsa.edu.my
          </a>
        </p>

        {/* <div className="mx-auto mt-5 max-w-4xl rounded-2xl bg-amber-50 p-4 text-left">
          <div className="mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h3 className="text-sm font-black text-amber-900">Disclaimer</h3>
          </div>

          <p className="text-xs leading-relaxed text-amber-900/80">
            This system is intended for research and decision support purposes
            only. AI grading results should be verified by qualified personnel
            or standard FFB grading procedures before being used for operational
            or commercial decisions.
          </p>
        </div> */}
      </div>
    </footer>
  );
}