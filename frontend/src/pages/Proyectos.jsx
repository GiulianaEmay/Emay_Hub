import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X, LayoutGrid, ListChecks, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";

const ESTADOS = [
  { k: "levantamiento", l: "Levantamiento", c: "slate" },
  { k: "diseno", l: "Diseño", c: "blue" },
  { k: "desarrollo", l: "Desarrollo", c: "purple" },
  { k: "qa", l: "QA", c: "orange" },
  { k: "implementacion", l: "Implementación", c: "purple" },
  { k: "capacitacion", l: "Capacitación", c: "green" },
  { k: "cerrado", l: "Cerrado", c: "slate" },
];

function ProjectForm({ initial, clients, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    nombre: "", cliente_id: "", cliente_nombre: "", descripcion: "",
    estado: "levantamiento", prioridad: "media", responsable: "",
    fecha_inicio: "", fecha_fin: "", progreso: 0
  });
  const change = (k,v) => setForm(p=>({...p, [k]: v}));
  const submit = async (e) => {
    e.preventDefault();
    let payload = { ...form };
    if (payload.cliente_id) {
      const cl = clients.find(c=>c.id===payload.cliente_id);
      if (cl) payload.cliente_nombre = cl.empresa;
    }
    try {
      if (initial?.id) await api.patch(`/projects/${initial.id}`, payload);
      else await api.post("/projects", payload);
      toast.success("Proyecto guardado");
      onSaved(); onClose();
    } catch { toast.error("Error"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scroll" data-testid="project-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{initial?.id?"Editar Proyecto":"Nuevo Proyecto"}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre *</label>
            <input required value={form.nombre} onChange={e=>change("nombre",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="project-nombre" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</label>
            <select value={form.cliente_id || ""} onChange={e=>change("cliente_id", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              <option value="">— Ninguno —</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responsable</label>
            <input value={form.responsable} onChange={e=>change("responsable",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</label>
            <select value={form.estado} onChange={e=>change("estado", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              {ESTADOS.map(e=><option key={e.k} value={e.k}>{e.l}</option>)}
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha inicio</label>
            <input type="date" value={(form.fecha_inicio||"").substring(0,10)} onChange={e=>change("fecha_inicio", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha fin</label>
            <input type="date" value={(form.fecha_fin||"").substring(0,10)} onChange={e=>change("fecha_fin", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Progreso (%)</label>
            <input type="number" min="0" max="100" value={form.progreso} onChange={e=>change("progreso", parseInt(e.target.value)||0)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</label>
            <textarea value={form.descripcion||""} onChange={e=>change("descripcion",e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-project-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

export default function Proyectos() {
  const [view, setView] = useState("kanban");
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const load = async () => {
    const [r, c] = await Promise.all([api.get("/projects"), api.get("/clients")]);
    setItems(r.data); setClients(c.data);
  };
  useEffect(()=>{ load(); }, []);

  const onDrop = async (estado) => {
    if (!draggedId) return;
    const it = items.find(i=>i.id===draggedId);
    if (!it || it.estado===estado) { setDraggedId(null); return; }
    await api.patch(`/projects/${draggedId}`, { estado });
    setItems(prev => prev.map(p => p.id===draggedId ? {...p, estado} : p));
    setDraggedId(null);
    toast.success("Estado actualizado");
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar proyecto?")) return;
    await api.delete(`/projects/${id}`);
    setItems(p=>p.filter(x=>x.id!==id));
  };

  return (
    <div data-testid="proyectos-page">
      <SectionTitle title="Proyectos" subtitle="Gestiona implementaciones y desarrollos"
        action={
          <div className="flex gap-2">
            <Btn variant={view==="kanban"?"secondary":"outline"} onClick={()=>setView("kanban")}><LayoutGrid className="w-4 h-4" /></Btn>
            <Btn variant={view==="list"?"secondary":"outline"} onClick={()=>setView("list")}><ListChecks className="w-4 h-4" /></Btn>
            <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-project-btn"><Plus className="w-4 h-4" /> Nuevo Proyecto</Btn>
          </div>
        } />

      {view==="kanban" ? (
        <div className="flex gap-3 overflow-x-auto thin-scroll pb-4">
          {ESTADOS.map(e=>{
            const cards = items.filter(p=>p.estado===e.k);
            return (
              <div key={e.k} className="kanban-col p-3 min-w-[260px] flex-shrink-0"
                data-testid={`proj-col-${e.k}`}
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
                      <div className="text-sm font-semibold text-slate-800 truncate">{c.nombre}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{c.cliente_nombre || "—"}</div>
                      <div className="mt-2 h-1 bg-slate-100 rounded overflow-hidden">
                        <div className="h-full bg-[#6D4CC9]" style={{ width: `${c.progreso||0}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Pill color={c.prioridad==="urgente"?"red":c.prioridad==="alta"?"orange":"slate"}>{c.prioridad}</Pill>
                        <span className="text-[10px] text-slate-400">{c.progreso||0}%</span>
                      </div>
                    </div>
                  ))}
                  {cards.length===0 && <div className="text-[11px] text-slate-300 text-center py-6">Vacío</div>}
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
                <th className="text-left px-4 py-3">Proyecto</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Prioridad</th>
                <th className="text-left px-4 py-3">Progreso</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(p=>(
                <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{p.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{p.cliente_nombre || "—"}</td>
                  <td className="px-4 py-3"><Pill color={ESTADOS.find(e=>e.k===p.estado)?.c}>{ESTADOS.find(e=>e.k===p.estado)?.l}</Pill></td>
                  <td className="px-4 py-3">{p.prioridad}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded overflow-hidden max-w-[120px]">
                        <div className="h-full bg-[#6D4CC9]" style={{width: `${p.progreso||0}%`}} />
                      </div>
                      <span className="text-xs">{p.progreso||0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>{ setEditing(p); setShowForm(true); }} className="text-xs text-slate-600 hover:underline">Editar</button>
                    <button onClick={()=>del(p.id)} className="text-xs text-rose-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length===0 && <tr><td colSpan="6" className="py-12 text-center text-slate-400">Sin proyectos</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showForm && <ProjectForm initial={editing} clients={clients} onClose={()=>setShowForm(false)} onSaved={load} />}
    </div>
  );
}
