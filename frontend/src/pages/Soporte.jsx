import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill } from "@/components/UI";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

const ESTADOS = [
  { k: "nuevo", l: "Nuevo", c: "blue" },
  { k: "asignado", l: "Asignado", c: "purple" },
  { k: "en_proceso", l: "En proceso", c: "orange" },
  { k: "esperando_cliente", l: "Esperando cliente", c: "slate" },
  { k: "cerrado", l: "Cerrado", c: "green" },
];

function TicketForm({ initial, clients, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    titulo: "", descripcion: "", cliente_id: "", cliente_nombre: "",
    categoria: "general", prioridad: "media", responsable: "", estado: "nuevo"
  });
  const change = (k,v) => setForm(p=>({...p, [k]: v}));
  const submit = async (e) => {
    e.preventDefault();
    let payload = { ...form };
    if (payload.cliente_id) {
      const c = clients.find(x=>x.id===payload.cliente_id);
      if (c) payload.cliente_nombre = c.empresa;
    }
    try {
      if (initial?.id) await api.patch(`/tickets/${initial.id}`, payload);
      else await api.post("/tickets", payload);
      toast.success("Ticket guardado"); onSaved(); onClose();
    } catch { toast.error("Error"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" data-testid="ticket-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{initial?.id?"Editar":"Nuevo"} Ticket</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Título *</label>
            <input required value={form.titulo} onChange={e=>change("titulo",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="ticket-titulo" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</label>
            <textarea value={form.descripcion||""} onChange={e=>change("descripcion",e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</label>
            <select value={form.cliente_id||""} onChange={e=>change("cliente_id", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              <option value="">—</option>{clients.map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
            <select value={form.categoria} onChange={e=>change("categoria", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              <option value="general">General</option><option value="bug">Bug</option>
              <option value="feature">Feature</option><option value="config">Configuración</option>
              <option value="capacitacion">Capacitación</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Prioridad</label>
            <select value={form.prioridad} onChange={e=>change("prioridad", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              <option value="baja">Baja</option><option value="media">Media</option>
              <option value="alta">Alta</option><option value="urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responsable</label>
            <input value={form.responsable||""} onChange={e=>change("responsable",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</label>
            <select value={form.estado} onChange={e=>change("estado", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              {ESTADOS.map(e=><option key={e.k} value={e.k}>{e.l}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-ticket-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

export default function Soporte() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("todos");

  const load = async () => {
    const [t,c] = await Promise.all([api.get("/tickets"), api.get("/clients")]);
    setItems(t.data); setClients(c.data);
  };
  useEffect(()=>{ load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar ticket?")) return;
    await api.delete(`/tickets/${id}`);
    setItems(p=>p.filter(x=>x.id!==id));
  };

  const filtered = filter==="todos" ? items : items.filter(t=>t.estado===filter);

  return (
    <div data-testid="soporte-page">
      <SectionTitle title="Soporte" subtitle="Gestión de incidencias de clientes"
        action={
          <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-ticket-btn">
            <Plus className="w-4 h-4" /> Nuevo Ticket
          </Btn>
        }
      />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={()=>setFilter("todos")} className={`px-3 py-1.5 text-xs rounded-md ${filter==="todos"?"bg-[#F5F3FF] text-[#2D144D] font-medium":"text-slate-500"}`}>Todos ({items.length})</button>
        {ESTADOS.map(e=>(
          <button key={e.k} onClick={()=>setFilter(e.k)}
            className={`px-3 py-1.5 text-xs rounded-md ${filter===e.k?"bg-[#F5F3FF] text-[#2D144D] font-medium":"text-slate-500"}`}>
            {e.l} ({items.filter(t=>t.estado===e.k).length})
          </button>
        ))}
      </div>

      <div className="emay-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="text-left px-4 py-3">Ticket</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Categoría</th>
              <th className="text-left px-4 py-3">Prioridad</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-left px-4 py-3">Responsable</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t=>(
              <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50" data-testid={`ticket-row-${t.id}`}>
                <td className="px-4 py-3 font-medium">{t.titulo}</td>
                <td className="px-4 py-3 text-slate-600">{t.cliente_nombre || "—"}</td>
                <td className="px-4 py-3"><Pill>{t.categoria}</Pill></td>
                <td className="px-4 py-3">{t.prioridad}</td>
                <td className="px-4 py-3"><Pill color={ESTADOS.find(e=>e.k===t.estado)?.c}>{ESTADOS.find(e=>e.k===t.estado)?.l}</Pill></td>
                <td className="px-4 py-3 text-slate-600">{t.responsable || "—"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={()=>{ setEditing(t); setShowForm(true); }} className="text-xs text-slate-600 hover:underline">Editar</button>
                  <button onClick={()=>del(t.id)} className="text-xs text-rose-600 hover:underline">Eliminar</button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && <tr><td colSpan="7" className="py-12 text-center text-slate-400">Sin tickets</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && <TicketForm initial={editing} clients={clients} onClose={()=>setShowForm(false)} onSaved={load} />}
    </div>
  );
}
