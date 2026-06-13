import React, { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, Workflow, ListTodo, LifeBuoy,
  BookOpen, UserCircle2, Bell, ChevronDown, LogOut, Sparkles, Building2
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/crm", label: "CRM", icon: Sparkles, testid: "nav-crm" },
  { to: "/clientes", label: "Clientes", icon: Building2, testid: "nav-clientes" },
  { to: "/proyectos", label: "Proyectos", icon: Briefcase, testid: "nav-proyectos" },
  { to: "/procesos", label: "IA", icon: Workflow, testid: "nav-procesos" },
  { to: "/tareas", label: "Tareas", icon: ListTodo, testid: "nav-tareas" },
  { to: "/soporte", label: "Soporte", icon: LifeBuoy, testid: "nav-soporte" },
  { to: "/conocimiento", label: "Conocimiento", icon: BookOpen, testid: "nav-conocimiento" },
  { to: "/equipo", label: "Equipo", icon: UserCircle2, testid: "nav-equipo" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    api.get("/activities?limit=8").then(r => setNotifs(r.data)).catch(()=>{});
    api.post("/seed").catch(()=>{});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
      {/* TOP NAV */}
      <header className="emay-gradient sticky top-0 z-40 border-b border-white/5" data-testid="topnav">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center gap-8">
          {/* Brand wordmark */}
          <NavLink to="/dashboard" className="flex items-baseline gap-1.5 shrink-0" data-testid="brand-logo">
            <span
              className="text-[22px] font-extrabold tracking-[0.18em] text-white leading-none"
              style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}
            >
              EMAY
            </span>
            <span className="text-[9px] uppercase tracking-[0.22em] text-[#A38BFF] font-bold">Hub</span>
          </NavLink>

          {/* Divider */}
          <div className="h-6 w-px bg-white/15 shrink-0"></div>

          {/* Nav items */}
          <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto thin-scroll">
            {nav.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={n.testid}
                className={({isActive}) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-white/12 text-white"
                      : "text-white/65 hover:text-white hover:bg-white/8"
                  }`
                }
              >
                <n.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            <div className="relative">
              <button
                data-testid="notifications-btn"
                onClick={()=>setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-md hover:bg-white/10 text-white/80"
              >
                <Bell className="w-4 h-4" />
                {notifs.length>0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#A38BFF] rounded-full live-dot" />
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold">Actividad reciente</div>
                  </div>
                  <div className="max-h-96 overflow-y-auto thin-scroll">
                    {notifs.length === 0 && (
                      <div className="px-4 py-6 text-xs text-slate-400 text-center">Sin actividad aún</div>
                    )}
                    {notifs.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50">
                        <div className="text-xs text-slate-500 mb-1">{n.actor} {n.action}</div>
                        <div className="text-sm text-slate-800">{n.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                data-testid="user-menu-btn"
                onClick={()=>setMenu(!menu)}
                className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-white/10"
              >
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full ring-2 ring-white/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 grid place-items-center text-white text-xs font-bold">
                    {user?.name?.[0] || "?"}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-white/60" />
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg border border-slate-200 shadow-xl overflow-hidden z-50">
                  <div className="px-3 py-3 border-b border-slate-100">
                    <div className="text-sm font-semibold text-slate-800 truncate">{user?.name}</div>
                    <div className="text-xs text-slate-500 truncate">{user?.email}</div>
                  </div>
                  <button
                    data-testid="logout-btn"
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50 text-slate-700"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 p-5 sm:p-6 max-w-[1600px] w-full mx-auto" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
}
