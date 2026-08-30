import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const NAV_ITEMS = [
  { label: "Live Map", to: "/" },
  { label: "Farms", to: "/farms" },
  { label: "Detections", to: "/detections" },
  { label: "Disasters", to: "/disasters" },
  { label: "Analytics", to: "/analytics" },
  { label: "Reports", to: "/reports" },
  { label: "Settings", to: "/settings" },
];

interface AppShellProps {
  children: ReactNode;
  headerRight?: ReactNode;
}

export default function AppShell({ children, headerRight }: AppShellProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileNavOpen(true)}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Open navigation menu"
          >
            <MenuIcon />
          </button>
          <Link to="/" className="text-lg font-semibold text-slate-800">
            BantayAni
          </Link>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">{headerRight}</div>
          <NotificationBell />
          {user ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden text-slate-600 sm:inline">{user.name}</span>
              <span className="hidden rounded bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-500 sm:inline">
                {user.role.replace(/_/g, " ")}
              </span>
              {(user.region || user.province || user.municipality) && (
                <span className="hidden text-xs text-slate-400 md:inline">
                  Scoped to {user.municipality ?? user.province ?? user.region}
                </span>
              )}
              <button onClick={logout} className="text-xs text-slate-400 hover:text-slate-600">
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-sm font-medium text-agri-green hover:underline">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="hidden w-44 flex-shrink-0 flex-col gap-1 border-r border-slate-200 bg-white p-3 md:flex">
          <NavLinks currentPath={location.pathname} onNavigate={() => {}} />
        </nav>

        {isMobileNavOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/30" onClick={() => setIsMobileNavOpen(false)} />
            <div className="relative z-10 flex w-72 max-w-[85vw] flex-col bg-white shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <span className="text-base font-semibold text-slate-800">BantayAni</span>
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100"
                  aria-label="Close navigation menu"
                >
                  <CloseIcon />
                </button>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <NavLinks currentPath={location.pathname} onNavigate={() => setIsMobileNavOpen(false)} large />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function NavLinks({
  currentPath,
  onNavigate,
  large = false,
}: {
  currentPath: string;
  onNavigate: () => void;
  large?: boolean;
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = currentPath === item.to;
        return (
          <Link
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className={`rounded px-3 ${large ? "py-3 text-base" : "py-2 text-sm"} ${
              isActive ? "bg-agri-green/10 font-medium text-agri-green" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
