import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Pill } from "@/components/UI";
import {
  Users, Briefcase, ListTodo, LifeBuoy, TrendingUp, Sparkles, Building2,
  Activity, DollarSign, UsersRound
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#030447", "#340b5b", "#6D4CC9", "#A38BFF", "#C7B8FF", "#E2DAFA", "#F5F3FF"];
const ETAPA_LABELS = {
  prospecto: "Prospecto", contactado: "Contactado", reunion: "Reunión",
  diagnostico: "Diagnóstico", propuesta: "Propuesta", negociacion: "Negociación",
  ganado: "Ganado", perdido: "Perdido"
};
const PROJ_LABELS = {
  levantamiento: "Levantamiento", diseno: "Diseño", desarrollo: "Desarrollo",
  qa: "QA", implementacion: "Implementación", capacitacion: "Capacitación", cerrado: "Cerrado"
};

function MiniKPI({ label, value, icon: Icon, testid, accent = "#030447" }) {
  return (
    <div className="emay-card px-4 py-3 flex items-center gap-3" data-testid={testid}>
      <div className="w-9 h-9 rounded-md bg-[#F5F3FF] grid place-items-center shrink-0" style={{ color: accent }}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold leading-tight truncate">{label}</div>
        <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/activities?limit=8"),
        ]);
        setStats(s.data);
        setActivities(a.data);
      } catch (e) { console.error(e); }
    })();
  }, []);

  if (!stats) {
    return <div className="text-slate-500" data-testid="dashboard-loading">Cargando dashboard…</div>;
  }

  const funnel = stats.funnel.map(f => ({ name: ETAPA_LABELS[f.etapa] || f.etapa, value: f.total }));
  const projStates = stats.project_states.filter(p=>p.total>0).map(p => ({ name: PROJ_LABELS[p.estado] || p.estado, total: p.total }));

  return (
    <div className="space-y-4" data-testid="dashboard-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-xs text-slate-500">Estado integral de EMAY Solution</p>
        </div>
        <div className="text-xs text-slate-400">
          {new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      {/* KPIs - 4 cols, 2 rows compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniKPI label="Prospectos" value={stats.prospectos_total} icon={Sparkles} testid="kpi-prospectos" accent="#6D4CC9" />
        <MiniKPI label="Negociaciones" value={stats.negociaciones} icon={TrendingUp} testid="kpi-negociaciones" accent="#340b5b" />
        <MiniKPI label="Clientes activos" value={stats.clientes_activos} icon={Building2} testid="kpi-clientes" accent="#030447" />
        <MiniKPI label="Proyectos activos" value={stats.proyectos_activos} icon={Briefcase} testid="kpi-proyectos" accent="#6D4CC9" />
        <MiniKPI label="Tareas pendientes" value={stats.tareas_pendientes} icon={ListTodo} testid="kpi-tareas" accent="#A38BFF" />
        <MiniKPI label="Tickets abiertos" value={stats.tickets_abiertos} icon={LifeBuoy} testid="kpi-tickets" accent="#340b5b" />
        <MiniKPI label="Ventas estimadas" value={`S/ ${Number(stats.ventas_estimadas).toLocaleString()}`} icon={DollarSign} testid="kpi-ventas" accent="#030447" />
        <MiniKPI label="Equipo activo" value={stats.team_productivity.length || 0} icon={UsersRound} testid="kpi-team" accent="#6D4CC9" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="emay-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Embudo comercial</div>
            <div className="text-xs text-slate-400">Pipeline por etapa</div>
          </div>
          <div className="h-[180px]">
            <ResponsiveContainer>
              <BarChart data={funnel} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F0F5" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <RTooltip cursor={{ fill: "#F5F3FF" }} contentStyle={{ borderRadius: 8, border: "1px solid #EAEAEA", fontSize: 12 }} />
                <Bar dataKey="value" fill="#6D4CC9" radius={[6,6,0,0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="emay-card p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Estado proyectos</div>
            <Pill color="purple">{projStates.length}</Pill>
          </div>
          <div className="h-[180px]">
            {projStates.length === 0 ? (
              <div className="grid place-items-center h-full text-xs text-slate-400">Sin datos</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={projStates} dataKey="total" nameKey="name" outerRadius={60} innerRadius={36} paddingAngle={2}>
                    {projStates.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="emay-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Clientes por rubro</div>
          <div className="h-[160px]">
            {stats.clients_by_rubro.length === 0 ? (
              <div className="grid place-items-center h-full text-xs text-slate-400">Sin datos</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.clients_by_rubro} dataKey="total" nameKey="rubro" outerRadius={55}>
                    {stats.clients_by_rubro.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 10 }} iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="emay-card p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">Productividad equipo</div>
          <div className="h-[160px]">
            {stats.team_productivity.length === 0 ? (
              <div className="grid place-items-center h-full text-xs text-slate-400">Sin datos</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={stats.team_productivity} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F0F5" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#6B7280" }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="miembro" tick={{ fontSize: 10, fill: "#6B7280" }} width={90} axisLine={false} tickLine={false} />
                  <RTooltip />
                  <Bar dataKey="completadas" fill="#030447" radius={[0,4,4,0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="emay-card p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Actividad reciente</div>
            <span className="text-[10px] text-[#6D4CC9] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#6D4CC9] rounded-full live-dot" /> En vivo</span>
          </div>
          <div className="space-y-2 h-[150px] overflow-y-auto thin-scroll pr-1">
            {activities.length === 0 && (
              <div className="text-xs text-slate-400 text-center py-6">Sin actividad</div>
            )}
            {activities.slice(0,6).map(a => (
              <div key={a.id} className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full emay-gradient grid place-items-center text-white text-[10px] font-bold shrink-0">
                  {(a.actor || "?")[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-slate-700 truncate">
                    <span className="font-medium">{a.actor}</span>{" "}
                    <span className="text-slate-500">{a.action}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
