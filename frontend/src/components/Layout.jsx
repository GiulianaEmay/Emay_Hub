import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, Workflow, ListTodo, LifeBuoy,
  BookOpen, UserCircle2, Settings, Bell, Search, ChevronDown, LogOut, Sparkles, Building2
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { toast } from "sonner";
import { EMAY_LOGO_URL } from "../lib/brand";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/crm", label: "CRM", icon: Sparkles, testid: "nav-crm" },
  { to: "/clientes", label: "Clientes", icon: Building2, testid: "nav-clientes" },
  { to: "/proyectos", label: "Proyectos", icon: Briefcase, testid: "nav-proyectos" },
  { to: "/procesos", label: "Levantamiento IA", icon: Workflow, testid: "nav-procesos" },
  { to: "/tareas", label: "Tareas", icon: ListTodo, testid: "nav-tareas" },
  { to: "/soporte", label: "Soporte", icon: LifeBuoy, testid: "nav-soporte" },
  { to: "/conocimiento", label: "Base de Conocimiento", icon: BookOpen, testid: "nav-conocimiento" },
  { to: "/equipo", label: "Equipo", icon: UserCircle2, testid: "nav-equipo" },
  { to: "/configuracion", label: "Configuración", icon: Settings, testid: "nav-configuracion" },
];

function GlobalSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get(`/search?q=${encodeURIComponent(q)}`);
        setResults(r.data.results || []);
        setOpen(true);
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const onPick = (r) => {
    const map = {
      cliente: `/clientes`,
      prospecto: `/crm`,
      proyecto: `/proyectos`,
      tarea: `/tareas`,
      ticket: `/soporte`,
      kb: `/conocimiento`,
    };
    navigate(map[r.type] || "/dashboard");
    setOpen(false); setQ("");
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus-within:border-[#6D4CC9]">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          data-testid="global-search-input"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          onFocus={()=>q.length>=2 && setOpen(true)}
          placeholder="Buscar clientes, proyectos, tareas..."
          className="bg-transparent flex-1 outline-none text-sm placeholder:text-slate-400"
        />
        <kbd className="text-[10px] text-slate-400 px-1.5 py-0.5 border border-slate-200 rounded">⌘K</kbd>
      </div>
      {open && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-white rounded-lg border border-slate-200 shadow-xl z-50 overflow-hidden">
          {results.map((r,i)=>(
            <button
              key={`${r.type}-${r.id}-${i}`}
              data-testid={`search-result-${i}`}
              onClick={()=>onPick(r)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50"
            >
              <span className="text-slate-700">{r.label}</span>
              <span className="text-[10px] uppercase text-slate-400">{r.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    api.get("/activities?limit=8").then(r => setNotifs(r.data)).catch(()=>{});
    // initial seed (only inserts if no clients exist)
    api.post("/seed").catch(()=>{});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex">
      {/* Sidebar */}
      <aside className="w-[260px] shrink-0 bg-white border-r border-slate-100 flex flex-col" data-testid="sidebar">
        <div className="px-3 py-3 flex items-center justify-center border-b border-slate-100 emay-gradient">
          <img src={EMAY_LOGO_URL} alt="EMAY HUB" className="h-14 w-auto object-contain" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 thin-scroll overflow-y-auto">
          {nav.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              data-testid={n.testid}
              className={({isActive}) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <n.icon className="w-[18px] h-[18px]" strokeWidth={1.7} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-3 rounded-lg bg-[#F5F3FF]">
            <div className="text-[11px] uppercase tracking-wider text-[#6D4CC9] font-semibold">Premium</div>
            <p className="text-xs text-slate-700 mt-1 leading-snug">Plataforma operativa interna de EMAY Solution.</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="topbar-glass sticky top-0 z-40 px-6 py-3 flex items-center gap-4">
          <GlobalSearch />
          <div className="flex-1" />
          <div className="relative">
            <button
              data-testid="notifications-btn"
              onClick={()=>setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-slate-100"
            >
              <Bell className="w-5 h-5 text-slate-600" />
              {notifs.length>0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#6D4CC9] rounded-full live-dot" />
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
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100"
            >
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full emay-gradient grid place-items-center text-white text-xs font-bold">
                  {user?.name?.[0] || "?"}
                </div>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 mr-1" />
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
        </header>

        <main className="flex-1 p-4 sm:p-5 max-w-[1500px] w-full mx-auto" data-testid="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
