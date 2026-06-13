import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { StatCard, SectionTitle, Pill } from "@/components/UI";
import {
  Users, Briefcase, ListTodo, LifeBuoy, TrendingUp, Sparkles, Building2, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, FunnelChart, Funnel, LabelList
} from "recharts";

const COLORS = ["#2D144D", "#4B2E83", "#6D4CC9", "#A38BFF", "#C7B8FF", "#E2DAFA", "#F5F3FF"];
const ETAPA_LABELS = {
  prospecto: "Prospecto", contactado: "Contactado", reunion: "Reunión",
  diagnostico: "Diagnóstico", propuesta: "Propuesta", negociacion: "Negociación",
  ganado: "Ganado", perdido: "Perdido"
};
const PROJ_LABELS = {
  levantamiento: "Levantamiento", diseno: "Diseño", desarrollo: "Desarrollo",
  qa: "QA", implementacion: "Implementación", capacitacion: "Capacitación", cerrado: "Cerrado"
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [s, a] = await Promise.all([
          api.get("/dashboard/stats"),
          api.get("/activities?limit=10"),
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
  const projStates = stats.project_states.map(p => ({ name: PROJ_LABELS[p.estado] || p.estado, total: p.total }));

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <SectionTitle
        title="Dashboard Ejecutivo"
        subtitle="Estado integral de EMAY Solution"
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Prospectos Nuevos" value={stats.prospectos_nuevos} icon={Sparkles} testid="kpi-prospectos" />
        <StatCard label="Negociaciones" value={stats.negociaciones} icon={TrendingUp} testid="kpi-negociaciones" />
        <StatCard label="Clientes Activos" value={stats.clientes_activos} icon={Building2} testid="kpi-clientes" />
        <StatCard label="Proyectos Activos" value={stats.proyectos_activos} icon={Briefcase} testid="kpi-proyectos" />
        <StatCard label="Tareas Pendientes" value={stats.tareas_pendientes} icon={ListTodo} testid="kpi-tareas" />
        <StatCard label="Tickets Abiertos" value={stats.tickets_abiertos} icon={LifeBuoy} testid="kpi-tickets" />
        <StatCard label="Ventas Estimadas" value={`$ ${stats.ventas_estimadas.toLocaleString()}`} icon={TrendingUp} testid="kpi-ventas" />
        <StatCard label="Equipo activo" value={stats.team_productivity.length || 0} icon={Users} testid="kpi-team" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="emay-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Embudo comercial</div>
              <h3 className="text-lg font-semibold tracking-tight mt-1">Pipeline por etapa</h3>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={funnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F0F5" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="value" fill="#6D4CC9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="emay-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Estado de proyectos</div>
          <h3 className="text-lg font-semibold tracking-tight mt-1 mb-4">Distribución</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={projStates.filter(p=>p.total>0)} dataKey="total" nameKey="name" outerRadius={90} innerRadius={50}>
                  {projStates.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="emay-card p-6">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Clientes por rubro</div>
          <h3 className="text-lg font-semibold tracking-tight mt-1 mb-4">Diversificación</h3>
          <div className="h-64">
            {stats.clients_by_rubro.length === 0 ? (
              <div className="grid place-items-center h-full text-sm text-slate-400">Sin datos aún</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.clients_by_rubro} dataKey="total" nameKey="rubro" outerRadius={90}>
                    {stats.clients_by_rubro.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="emay-card p-6 lg:col-span-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Productividad del equipo</div>
          <h3 className="text-lg font-semibold tracking-tight mt-1 mb-4">Tareas completadas</h3>
          <div className="h-64">
            {stats.team_productivity.length === 0 ? (
              <div className="grid place-items-center h-full text-sm text-slate-400">Sin tareas completadas aún</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={stats.team_productivity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F0F5" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="miembro" tick={{ fontSize: 11, fill: "#6B7280" }} width={120} />
                  <RTooltip />
                  <Bar dataKey="completadas" fill="#2D144D" radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div className="emay-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actividad reciente</div>
            <h3 className="text-lg font-semibold tracking-tight mt-1">Timeline</h3>
          </div>
          <Pill color="purple"><Activity className="w-3 h-3 mr-1 inline" />En vivo</Pill>
        </div>
        <div className="space-y-3">
          {activities.length === 0 && (
            <div className="text-sm text-slate-400 text-center py-8">Aún no hay actividad registrada.</div>
          )}
          {activities.map(a => (
            <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className="w-7 h-7 rounded-full emay-gradient grid place-items-center text-white text-xs font-bold shrink-0">
                {(a.actor || "?")[0]}
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-800">
                  <span className="font-medium">{a.actor || "Sistema"}</span>
                  <span className="text-slate-500"> {a.action} </span>
                  <Pill color="slate">{a.entity_type}</Pill>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{a.description}</div>
              </div>
              <div className="text-[10px] text-slate-400 whitespace-nowrap">
                {new Date(a.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
