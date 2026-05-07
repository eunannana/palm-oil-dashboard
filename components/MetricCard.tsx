type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle: string;
  variant: "green" | "orange" | "red" | "dark";
};

const variants = {
  green: {
    card: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-900",
    dot: "bg-emerald-500",
  },
  orange: {
    card: "bg-orange-50 border-orange-100",
    text: "text-orange-900",
    dot: "bg-orange-500",
  },
  red: {
    card: "bg-red-50 border-red-100",
    text: "text-red-900",
    dot: "bg-red-500",
  },
  dark: {
    card: "bg-slate-950 border-slate-800",
    text: "text-white",
    dot: "bg-emerald-400",
  },
};

export default function MetricCard({
  title,
  value,
  subtitle,
  variant,
}: MetricCardProps) {
  const style = variants[variant];

  return (
    <div className={`rounded-3xl border p-5 ${style.card}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${style.dot}`} />
        <p className={`text-sm font-bold ${style.text}`}>{title}</p>
      </div>

      <p className={`text-4xl font-black ${style.text}`}>{value}</p>
      <p
        className={`mt-2 text-sm ${
          variant === "dark" ? "text-slate-300" : "text-slate-500"
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
}