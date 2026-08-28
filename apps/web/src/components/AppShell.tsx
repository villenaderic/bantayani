import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { label: "Live Map", to: "/" },
  { label: "Farms", to: "/farms" },
  { label: "Detections", to: "/detections" },
  { label: "Disasters", to: null },
  { label: "Analytics", to: "/analytics" },
  { label: "Reports", to: null },
  { label: "Settings", to: null },
];

interface AppShellProps {
  children: ReactNode;
  headerRight?: ReactNode;
}

export default function AppShell({ children, headerRight }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <Link to="/" className="text-lg font-semibold text-slate-800">
          BantayAni
        </Link>
        {headerRight ?? <span className="text-sm text-slate-500">Sample Region Office</span>}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="hidden w-44 flex-shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3 md:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = item.to !== null && location.pathname === item.to;
            if (item.to === null) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded px-3 py-2 text-sm text-slate-400"
                >
                  {item.label}
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">soon</span>
                </div>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`rounded px-3 py-2 text-sm ${
                  isActive ? "bg-agri-green/10 font-medium text-agri-green" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
