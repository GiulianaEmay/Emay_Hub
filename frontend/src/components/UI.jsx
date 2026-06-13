import React from "react";

export function StatCard({ label, value, icon: Icon, trend, accent = "#2D144D", testid }) {
  return (
    <div className="emay-card p-5" data-testid={testid}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</div>
        {Icon && (
          <div className="w-8 h-8 rounded-md bg-[#F5F3FF] grid place-items-center" style={{color: accent}}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
        {trend !== undefined && (
          <div className={`text-xs font-medium ${trend >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {trend >= 0 ? "+" : ""}{trend}%
          </div>
        )}
      </div>
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Pill({ children, color = "purple" }) {
  const colors = {
    purple: "bg-[#F5F3FF] text-[#2D144D]",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    orange: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colors[color]}`}>{children}</span>;
}

export function EmptyState({ title, subtitle, action }) {
  return (
    <div className="text-center py-20" data-testid="empty-state">
      <div className="w-12 h-12 rounded-full bg-[#F5F3FF] grid place-items-center mx-auto mb-4">
        <div className="w-6 h-6 rounded-full bg-[#A38BFF]" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Btn({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-[#2D144D] text-white hover:bg-[#4B2E83] shadow-sm",
    secondary: "bg-[#F5F3FF] text-[#2D144D] hover:bg-[#EAE5FF]",
    outline: "border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
