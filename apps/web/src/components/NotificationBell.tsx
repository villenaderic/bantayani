import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchAlerts, markAlertRead, type AlertItem } from "../lib/api";

const SEVERITY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  significant: "bg-amber-500",
  moderate: "bg-yellow-500",
  low: "bg-emerald-500",
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setAlerts(null);
      return;
    }
    let cancelled = false;
    fetchAlerts()
      .then((data) => {
        if (!cancelled) setAlerts(data);
      })
      .catch(() => {
        // No live backend, or the request failed. The bell simply stays
        // hidden rather than showing an error for a non-essential feature.
        if (!cancelled) setAlerts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user || alerts === null) return null;

  const unreadCount = alerts.filter((a) => a.status === "unread").length;

  async function handleAlertClick(alert: AlertItem) {
    if (alert.status === "unread") {
      try {
        const updated = await markAlertRead(alert.id);
        setAlerts((prev) => prev?.map((a) => (a.id === alert.id ? updated : a)) ?? null);
      } catch {
        // Leave it unread locally if the backend call failed; not critical.
      }
    }
    setIsOpen(false);
    navigate(`/farms/${alert.farmId}`);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="relative rounded p-1.5 text-slate-500 hover:bg-slate-100"
        aria-label="Notifications"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-9 z-50 max-h-96 w-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Alerts
          </div>
          {alerts.length === 0 ? (
            <p className="p-4 text-sm text-slate-400">No alerts.</p>
          ) : (
            alerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => handleAlertClick(alert)}
                className={`flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50 ${
                  alert.status === "unread" ? "bg-agri-green/5" : ""
                }`}
              >
                <span
                  className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${SEVERITY_DOT[alert.severity] ?? "bg-slate-400"}`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {alert.farmId}, {alert.damageType}
                  </p>
                  <p className="text-xs text-slate-500">
                    {alert.municipality}, {alert.province}
                  </p>
                  <p className="text-[11px] text-slate-400">{formatRelative(alert.createdAt)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatRelative(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
