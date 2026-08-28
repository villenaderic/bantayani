interface DataSourceBadgeProps {
  isLive: boolean;
  isLoading: boolean;
}

export default function DataSourceBadge({ isLive, isLoading }: DataSourceBadgeProps) {
  if (isLoading) {
    return <span className="text-xs text-slate-400">Checking backend connection...</span>;
  }

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isLive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isLive ? "Live backend" : "Demo data, backend not connected"}
    </span>
  );
}
