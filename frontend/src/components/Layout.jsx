import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Briefcase, Workflow, ListTodo, LifeBuoy,
  BookOpen, UserCircle2, Settings, Bell, Search, ChevronDown, LogOut, Sparkles, Building2
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { EMAY_LOGO_URL } from "../lib/brand";

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
  { to: "/configuracion", label: "Ajustes", icon: Settings, testid: "nav-configuracion" },
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
      cliente: `/clientes`, prospecto: `/crm`, proyecto: `/proyectos`,
      tarea: `/tareas`, ticket: `/soporte`, kb: `/conocimiento`,
    };
    navigate(map[r.type] || "/dashboard");
    setOpen(false); setQ("");
  };

  return (
    <div className="relative w-full max-w-[260px]">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 focus-within:border-[#A38BFF]">
        <Search className="w-4 h-4 text-white/60" />
        <input
          data-testid="global-search-input"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          onFocus={()=>q.length>=2 && setOpen(true)}
          placeholder="Buscar…"
          className="bg-transparent flex-1 outline-none text-sm text-white placeholder:text-white/50"
        />
        <kbd className="text-[10px] text-white/50 px-1.5 py-0.5 border border-white/20 rounded">⌘K</kbd>
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
    api.post("/seed").catch(()=>{});
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFB] flex flex-col">
      {/* TOP NAV - dark gradient bar */}
      <header className="emay-gradient sticky top-0 z-40" data-testid="topnav">
        <div className="max-w-[1600px] mx-auto px-5 py-2.5 flex items-center gap-6">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center shrink-0" data-testid="brand-logo">
            <img
              src={EMAY_LOGO_URL}
              alt="EMAY"
              className="h-9 w-auto object-contain"
              style={{ mixBlendMode: 'screen' }}
            />
          </NavLink>

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
                      ? "bg-white/15 text-white"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`
                }
              >
                <n.icon className="w-3.5 h-3.5" strokeWidth={1.8} />
                <span>{n.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Search + actions */}
          <div className="flex items-center gap-2 shrink-0">
            <GlobalSearch />
            <div className="relative">
              <button
                data-testid="notifications-btn"
                onClick={()=>setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-md hover:bg-white/10 text-white/80"
              >
                <Bell className="w-4.5 h-4.5" />
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
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/10"
              >
                {user?.picture ? (
                  <img src={user.picture} alt="" className="w-7 h-7 rounded-full ring-2 ring-white/20" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 grid place-items-center text-white text-xs font-bold">
                    {user?.name?.[0] || "?"}
                  </div>
                )}
                <ChevronDown className="w-3 h-3 text-white/60 mr-1" />
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

      {/* Main content - full width */}
      <main className="flex-1 p-5 sm:p-6 max-w-[1600px] w-full mx-auto" data-testid="main-content">
        <Outlet />
      </main>
    </div>
  );
}
