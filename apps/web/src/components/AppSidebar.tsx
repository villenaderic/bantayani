const NAV_ITEMS = [
  { label: "Live Map", active: true },
  { label: "Farms", active: false },
  { label: "Detections", active: false },
  { label: "Disasters", active: false },
  { label: "Analytics", active: false },
  { label: "Reports", active: false },
  { label: "Settings", active: false },
];

export default function AppSidebar() {
  return (
    <nav className="hidden w-44 flex-col gap-1 border-r border-slate-200 bg-white p-3 md:flex">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.label}
          className={`flex items-center justify-between rounded px-3 py-2 text-sm ${
            item.active
              ? "bg-agri-green/10 font-medium text-agri-green"
              : "text-slate-400"
          }`}
        >
          {item.label}
          {!item.active && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">soon</span>
          )}
        </div>
      ))}
    </nav>
  );
}
