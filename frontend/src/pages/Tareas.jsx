import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X, LayoutGrid, ListChecks } from "lucide-react";
import { toast } from "sonner";

const ESTADOS = [
  { k: "pendiente", l: "Pendiente", c: "slate" },
  { k: "en_proceso", l: "En proceso", c: "purple" },
  { k: "en_revision", l: "En revisión", c: "orange" },
  { k: "completado", l: "Completado", c: "green" },
];

function TaskForm({ initial, projects, clients, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    titulo: "", descripcion: "", cliente_id: "", proyecto_id: "",
    responsable: "", prioridad: "media", estado: "pendiente", fecha_limite: ""
  });
  const change = (k,v) => setForm(p=>({...p, [k]: v}));
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (initial?.id) await api.patch(`/tasks/${initial.id}`, form);
      else await api.post("/tasks", form);
      toast.success("Tarea guardada"); onSaved(); onClose();
    } catch { toast.error("Error"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" data-testid="task-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{initial?.id?"Editar":"Nueva"} Tarea</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Título *</label>
            <input required value={form.titulo} onChange={e=>change("titulo",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="task-titulo" />
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proyecto</label>
            <select value={form.proyecto_id||""} onChange={e=>change("proyecto_id", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              <option value="">—</option>{projects.map(p=><option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responsable</label>
            <input value={form.responsable||""} onChange={e=>change("responsable",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</label>
            <select value={form.estado} onChange={e=>change("estado", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              {ESTADOS.map(e=><option key={e.k} value={e.k}>{e.l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha límite</label>
            <input type="date" value={(form.fecha_limite||"").substring(0,10)} onChange={e=>change("fecha_limite", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-task-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

export default function Tareas() {
  const [view, setView] = useState("kanban");
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const load = async () => {
    const [t,p,c] = await Promise.all([api.get("/tasks"), api.get("/projects"), api.get("/clients")]);
    setItems(t.data); setProjects(p.data); setClients(c.data);
  };
  useEffect(()=>{ load(); }, []);

  const onDrop = async (estado) => {
    if (!draggedId) return;
    const it = items.find(i=>i.id===draggedId);
    if (!it || it.estado===estado) { setDraggedId(null); return; }
    await api.patch(`/tasks/${draggedId}`, { estado });
    setItems(prev => prev.map(p=>p.id===draggedId?{...p, estado}:p));
    setDraggedId(null);
    toast.success("Tarea actualizada");
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar tarea?")) return;
    await api.delete(`/tasks/${id}`);
    setItems(p=>p.filter(x=>x.id!==id));
  };

  return (
    <div data-testid="tareas-page">
      <SectionTitle title="Tareas" subtitle="Gestión del trabajo interno"
        action={
          <div className="flex gap-2">
            <Btn variant={view==="kanban"?"secondary":"outline"} onClick={()=>setView("kanban")}><LayoutGrid className="w-4 h-4" /></Btn>
            <Btn variant={view==="list"?"secondary":"outline"} onClick={()=>setView("list")}><ListChecks className="w-4 h-4" /></Btn>
            <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-task-btn"><Plus className="w-4 h-4" /> Nueva Tarea</Btn>
          </div>
        } />

      {view==="kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {ESTADOS.map(e=>{
            const cards = items.filter(t=>t.estado===e.k);
            return (
              <div key={e.k} className="kanban-col p-3 min-h-[400px]" data-testid={`task-col-${e.k}`}
                onDragOver={ev=>ev.preventDefault()} onDrop={()=>onDrop(e.k)}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <Pill color={e.c}>{e.l}</Pill>
                  <span className="text-xs text-slate-400">{cards.length}</span>
                </div>
                <div className="space-y-2">
                  {cards.map(c=>(
                    <div key={c.id} draggable onDragStart={()=>setDraggedId(c.id)}
                      className={`kanban-card p-3 ${draggedId===c.id?"dragging":""}`}
                      onClick={()=>{ setEditing(c); setShowForm(true); }}>
                      <div className="text-sm font-medium text-slate-800">{c.titulo}</div>
                      {c.descripcion && <div className="text-xs text-slate-500 mt-1 line-clamp-2">{c.descripcion}</div>}
                      <div className="flex items-center justify-between mt-2">
                        <Pill color={c.prioridad==="urgente"?"red":c.prioridad==="alta"?"orange":"slate"}>{c.prioridad}</Pill>
                        {c.responsable && <span className="text-[10px] text-slate-400">{c.responsable}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="emay-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="text-left px-4 py-3">Tarea</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Prioridad</th>
                <th className="text-left px-4 py-3">Responsable</th>
                <th className="text-left px-4 py-3">Fecha límite</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map(t=>(
                <tr key={t.id} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{t.titulo}</td>
                  <td className="px-4 py-3"><Pill color={ESTADOS.find(e=>e.k===t.estado)?.c}>{ESTADOS.find(e=>e.k===t.estado)?.l}</Pill></td>
                  <td className="px-4 py-3">{t.prioridad}</td>
                  <td className="px-4 py-3">{t.responsable || "—"}</td>
                  <td className="px-4 py-3">{t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>{ setEditing(t); setShowForm(true); }} className="text-xs text-slate-600 hover:underline">Editar</button>
                    <button onClick={()=>del(t.id)} className="text-xs text-rose-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan="6" className="py-12 text-center text-slate-400">Sin tareas</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <TaskForm initial={editing} projects={projects} clients={clients} onClose={()=>setShowForm(false)} onSaved={load} />}
    </div>
  );
}
