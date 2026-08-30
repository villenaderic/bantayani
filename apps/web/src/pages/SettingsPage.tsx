import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import DataSourceBadge from "../components/DataSourceBadge";
import { useAuth } from "../context/AuthContext";
import { useBantayaniData } from "../hooks/useBantayaniData";
import { fetchAuditLogs, type AuditLogEntry } from "../lib/api";

const AUDIT_VIEWER_ROLES = new Set(["national_administrator", "gis_analyst"]);

export default function SettingsPage() {
  const { user } = useAuth();
  const { isLive, isLoading } = useBantayaniData();
  const canViewAuditLog = Boolean(user && AUDIT_VIEWER_ROLES.has(user.role));

  return (
    <AppShell headerRight={<DataSourceBadge isLive={isLive} isLoading={isLoading} />}>
      <div className="p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
          <p className="text-sm text-slate-500">Account details and audit log</p>
        </div>

        <div className="mb-4 max-w-md rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Account</h3>
          {user ? (
            <div className="space-y-2 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role.replace(/_/g, " ")} />
              <Row label="Agency" value={user.agency ?? "Not set"} />
              <Row label="Assigned scope" value={user.municipality ?? user.province ?? user.region ?? "National, unscoped"} />
            </div>
          ) : (
            <p className="text-sm text-slate-400">Not signed in.</p>
          )}
        </div>

        <div className="max-w-3xl rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Audit log</h3>
          {!isLive ? (
            <p className="text-sm text-slate-400">
              The audit log requires a live backend connection. Currently showing demo data.
            </p>
          ) : !canViewAuditLog ? (
            <p className="text-sm text-slate-400">
              The audit log is visible to national administrator and GIS analyst accounts.
            </p>
          ) : (
            <AuditLogTable />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-50 pb-1 last:border-0">
      <span className="capitalize text-slate-400">{label}</span>
      <span className="capitalize text-slate-700">{value}</span>
    </div>
  );
}

function AuditLogTable() {
  const [entries, setEntries] = useState<AuditLogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAuditLogs()
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load audit log");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!entries) return <p className="text-sm text-slate-400">Loading...</p>;
  if (entries.length === 0) return <p className="text-sm text-slate-400">No actions recorded yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">User</th>
            <th className="py-2 pr-4">Action</th>
            <th className="py-2 pr-4">Entity</th>
            <th className="py-2 pr-4">Change</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-b border-slate-50 last:border-0">
              <td className="py-2 pr-4 text-slate-500">{formatDateTime(entry.createdAt)}</td>
              <td className="py-2 pr-4 text-slate-700">{entry.userName ?? "Unknown user"}</td>
              <td className="py-2 pr-4 text-slate-700">{entry.action}</td>
              <td className="py-2 pr-4 text-slate-500">
                {entry.entityType}, {entry.entityId}
              </td>
              <td className="py-2 pr-4 text-slate-500">
                {entry.previousValue ?? "-"} &rarr; {entry.newValue ?? "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
