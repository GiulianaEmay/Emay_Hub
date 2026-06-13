import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

function MemberForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    nombre: "", cargo: "", especialidad: "", correo: "", telefono: "", activo: true
  });
  const change = (k,v) => setForm(p=>({...p, [k]: v}));
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (initial?.id) await api.patch(`/team/${initial.id}`, form);
      else await api.post("/team", form);
      toast.success("Guardado"); onSaved(); onClose();
    } catch { toast.error("Error"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl" data-testid="member-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{initial?.id?"Editar":"Nuevo"} Miembro</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre *</label>
            <input required value={form.nombre} onChange={e=>change("nombre",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="member-nombre" />
          </div>
          {[["cargo","Cargo"],["especialidad","Especialidad"],["correo","Correo"],["telefono","Teléfono"]].map(([k,l])=>(
            <div key={k}>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{l}</label>
              <input value={form[k]||""} onChange={e=>change(k,e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-member-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

export default function Equipo() {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [t,p,k] = await Promise.all([api.get("/team"), api.get("/projects"), api.get("/tasks")]);
    setItems(t.data); setProjects(p.data); setTasks(k.data);
  };
  useEffect(()=>{ load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar miembro?")) return;
    await api.delete(`/team/${id}`);
    setItems(p=>p.filter(x=>x.id!==id));
  };

  const indicators = (name) => {
    const proyectos = projects.filter(p => p.responsable === name).length;
    const taskActive = tasks.filter(t => t.responsable === name && t.estado !== "completado").length;
    const taskDone = tasks.filter(t => t.responsable === name && t.estado === "completado").length;
    return { proyectos, taskActive, taskDone };
  };

  return (
    <div data-testid="equipo-page">
      <SectionTitle title="Equipo" subtitle="Colaboradores y carga de trabajo"
        action={
          <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-member-btn">
            <Plus className="w-4 h-4" /> Nuevo Miembro
          </Btn>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(m=>{
          const ind = indicators(m.nombre);
          return (
            <div key={m.id} className="emay-card p-5" data-testid={`member-card-${m.id}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full emay-gradient grid place-items-center text-white font-bold text-lg">
                  {m.nombre[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 truncate">{m.nombre}</div>
                  <div className="text-xs text-slate-500 truncate">{m.cargo || "—"}</div>
                </div>
                <Pill color={m.activo?"green":"slate"}>{m.activo?"Activo":"Inactivo"}</Pill>
              </div>
              <div className="mt-3 text-xs text-slate-500">
                <div>{m.correo || "—"}</div>
                <div className="text-slate-400">{m.especialidad || "—"}</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-[#030447]">{ind.proyectos}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Proyectos</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-[#6D4CC9]">{ind.taskActive}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Activas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-emerald-600">{ind.taskDone}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Completadas</div>
                </div>
              </div>
              <div className="mt-3 flex justify-end gap-2 text-xs">
                <button onClick={()=>{ setEditing(m); setShowForm(true); }} className="text-slate-600 hover:underline">Editar</button>
                <button onClick={()=>del(m.id)} className="text-rose-600 hover:underline">Eliminar</button>
              </div>
            </div>
          );
        })}
        {items.length===0 && (
          <div className="col-span-full">
            <EmptyState title="Sin miembros aún" subtitle="Agrega miembros para gestionar la carga del equipo." />
          </div>
        )}
      </div>

      {showForm && <MemberForm initial={editing} onClose={()=>setShowForm(false)} onSaved={load} />}
    </div>
  );
}
