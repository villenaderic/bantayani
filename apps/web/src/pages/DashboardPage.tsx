export default function DashboardPage() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-lg font-semibold text-slate-800">BantayAni</h1>
        <span className="text-sm text-slate-500">Sample Region Office</span>
      </header>
      <main className="flex flex-1 items-center justify-center bg-slate-50">
        <p className="text-slate-500">
          Interactive map and farm inspection panel will render here.
        </p>
      </main>
    </div>
  );
}
