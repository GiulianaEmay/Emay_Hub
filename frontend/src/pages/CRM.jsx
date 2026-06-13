import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X, ListChecks, LayoutGrid, Phone, Mail, MessageCircle, CalendarDays, Eye } from "lucide-react";
import { toast } from "sonner";

const ETAPAS = [
  { key: "prospecto", label: "Prospecto", color: "slate" },
  { key: "contactado", label: "Contactado", color: "blue" },
  { key: "reunion", label: "Reunión", color: "purple" },
  { key: "diagnostico", label: "Diagnóstico", color: "purple" },
  { key: "propuesta", label: "Propuesta", color: "orange" },
  { key: "negociacion", label: "Negociación", color: "orange" },
  { key: "ganado", label: "Ganado", color: "green" },
  { key: "perdido", label: "Perdido", color: "red" },
];

function ProspectForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    empresa: "", razon_social: "", ruc: "", rubro: "", tamano: "",
    pagina_web: "", direccion: "", ciudad: "",
    contacto_nombre: "", cargo: "", telefono: "", whatsapp: "", correo: "", linkedin: "",
    fuente: "", responsable: "", valor_estimado: 0, probabilidad: 0, etapa: "prospecto", notas: ""
  });
  const change = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (initial?.id) {
        await api.patch(`/prospects/${initial.id}`, form);
        toast.success("Prospecto actualizado");
      } else {
        await api.post("/prospects", form);
        toast.success("Prospecto creado");
      }
      onSaved();
      onClose();
    } catch (e) { toast.error("Error al guardar"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form
        onClick={e=>e.stopPropagation()}
        onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scroll"
        data-testid="prospect-form"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{initial?.id ? "Editar Prospecto" : "Nuevo Prospecto"}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded" data-testid="close-prospect-form"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            ["empresa","Empresa *"], ["razon_social","Razón Social"], ["ruc","RUC"], ["rubro","Rubro"],
            ["tamano","Tamaño empresa"], ["pagina_web","Página web"], ["direccion","Dirección"], ["ciudad","Ciudad"],
            ["contacto_nombre","Nombre contacto"], ["cargo","Cargo"], ["telefono","Teléfono"], ["whatsapp","WhatsApp"],
            ["correo","Correo"], ["linkedin","LinkedIn"], ["fuente","Fuente del lead"], ["responsable","Responsable comercial"],
          ].map(([k,l]) => (
            <div key={k}>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{l}</label>
              <input
                data-testid={`prospect-${k}`}
                required={k==="empresa"}
                value={form[k] || ""}
                onChange={e=>change(k, e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valor estimado (USD)</label>
            <input type="number" value={form.valor_estimado} onChange={e=>change("valor_estimado", parseFloat(e.target.value)||0)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"
              data-testid="prospect-valor"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Probabilidad (%)</label>
            <input type="number" min="0" max="100" value={form.probabilidad} onChange={e=>change("probabilidad", parseInt(e.target.value)||0)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"
              data-testid="prospect-probabilidad"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Etapa</label>
            <select value={form.etapa} onChange={e=>change("etapa", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"
              data-testid="prospect-etapa"
            >
              {ETAPAS.map(e=><option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notas</label>
            <textarea value={form.notas || ""} onChange={e=>change("notas", e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"
              data-testid="prospect-notas"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-prospect-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

function ProspectDetail({ prospect, onClose, onUpdate }) {
  const [interactions, setInteractions] = useState([]);
  const [showInt, setShowInt] = useState(false);
  const [newInt, setNewInt] = useState({ tipo: "llamada", titulo: "", descripcion: "" });

  useEffect(() => {
    api.get(`/interactions?prospect_id=${prospect.id}`).then(r=>setInteractions(r.data)).catch(()=>{});
  }, [prospect.id]);

  const addInteraction = async () => {
    if (!newInt.titulo) { toast.error("Título requerido"); return; }
    try {
      const r = await api.post("/interactions", { ...newInt, prospect_id: prospect.id });
      setInteractions(prev=>[r.data, ...prev]);
      setNewInt({ tipo: "llamada", titulo: "", descripcion: "" });
      setShowInt(false);
      toast.success("Interacción registrada");
    } catch { toast.error("Error"); }
  };

  const icons = { llamada: Phone, correo: Mail, whatsapp: MessageCircle, reunion: CalendarDays, visita: CalendarDays, demo: Eye };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto thin-scroll" data-testid="prospect-detail">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-semibold">{prospect.empresa}</h3>
            <p className="text-xs text-slate-500">{prospect.contacto_nombre} · {prospect.cargo}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-xs text-slate-400 uppercase">Rubro</div>{prospect.rubro || "—"}</div>
            <div><div className="text-xs text-slate-400 uppercase">Ciudad</div>{prospect.ciudad || "—"}</div>
            <div><div className="text-xs text-slate-400 uppercase">Teléfono</div>{prospect.telefono || "—"}</div>
            <div><div className="text-xs text-slate-400 uppercase">Correo</div>{prospect.correo || "—"}</div>
            <div><div className="text-xs text-slate-400 uppercase">Valor estimado</div>$ {(prospect.valor_estimado||0).toLocaleString()}</div>
            <div><div className="text-xs text-slate-400 uppercase">Probabilidad</div>{prospect.probabilidad}%</div>
            <div className="col-span-2"><div className="text-xs text-slate-400 uppercase">Notas</div>{prospect.notas || "—"}</div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Interacciones</h4>
              <Btn variant="secondary" onClick={()=>setShowInt(!showInt)} data-testid="add-interaction-btn">
                <Plus className="w-3.5 h-3.5" /> Registrar
              </Btn>
            </div>
            {showInt && (
              <div className="bg-slate-50 rounded-lg p-4 mb-3 space-y-2">
                <select value={newInt.tipo} onChange={e=>setNewInt({...newInt, tipo: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white">
                  <option value="llamada">Llamada</option>
                  <option value="correo">Correo</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="reunion">Reunión</option>
                  <option value="visita">Visita</option>
                  <option value="demo">Demostración</option>
                </select>
                <input placeholder="Título" value={newInt.titulo} onChange={e=>setNewInt({...newInt, titulo: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="interaction-title" />
                <textarea placeholder="Descripción" value={newInt.descripcion} onChange={e=>setNewInt({...newInt, descripcion: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm" rows={2} />
                <Btn onClick={addInteraction} data-testid="save-interaction-btn">Guardar interacción</Btn>
              </div>
            )}
            <div className="space-y-2">
              {interactions.length === 0 && <div className="text-xs text-slate-400 py-4 text-center">Aún sin interacciones</div>}
              {interactions.map(i => {
                const Icon = icons[i.tipo] || MessageCircle;
                return (
                  <div key={i.id} className="flex items-start gap-3 p-3 rounded-md bg-slate-50">
                    <div className="w-7 h-7 rounded bg-[#F5F3FF] grid place-items-center"><Icon className="w-3.5 h-3.5 text-[#6D4CC9]" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{i.titulo}</div>
                      {i.descripcion && <div className="text-xs text-slate-500 mt-0.5">{i.descripcion}</div>}
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{i.tipo} · {new Date(i.fecha).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CRM() {
  const [view, setView] = useState("kanban");
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  const load = async () => {
    try { const r = await api.get("/prospects"); setItems(r.data); } catch {}
  };
  useEffect(() => { load(); }, []);

  const onDragStart = (id) => setDraggedId(id);
  const onDrop = async (etapa) => {
    if (!draggedId) return;
    const it = items.find(i => i.id === draggedId);
    if (!it || it.etapa === etapa) { setDraggedId(null); return; }
    try {
      await api.patch(`/prospects/${draggedId}`, { etapa });
      setItems(prev => prev.map(p => p.id === draggedId ? { ...p, etapa } : p));
      toast.success(`Movido a "${ETAPAS.find(e=>e.key===etapa)?.label}"`);
    } catch { toast.error("Error al mover"); }
    setDraggedId(null);
  };

  const del = async (id) => {
    if (!confirm("¿Eliminar este prospecto?")) return;
    await api.delete(`/prospects/${id}`);
    setItems(p => p.filter(x => x.id !== id));
    toast.success("Eliminado");
  };

  return (
    <div data-testid="crm-page">
      <SectionTitle
        title="CRM"
        subtitle="Oportunidades comerciales y pipeline"
        action={
          <div className="flex gap-2">
            <Btn variant={view==="kanban"?"secondary":"outline"} onClick={()=>setView("kanban")} data-testid="view-kanban">
              <LayoutGrid className="w-4 h-4" /> Kanban
            </Btn>
            <Btn variant={view==="list"?"secondary":"outline"} onClick={()=>setView("list")} data-testid="view-list">
              <ListChecks className="w-4 h-4" /> Lista
            </Btn>
            <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-prospect-btn">
              <Plus className="w-4 h-4" /> Nuevo Prospecto
            </Btn>
          </div>
        }
      />

      {view === "kanban" ? (
        <div className="flex gap-3 overflow-x-auto thin-scroll pb-4">
          {ETAPAS.map(et => {
            const cards = items.filter(p => p.etapa === et.key);
            return (
              <div
                key={et.key}
                className="kanban-col p-3 min-w-[280px] flex-shrink-0"
                data-testid={`kanban-col-${et.key}`}
                onDragOver={e=>e.preventDefault()}
                onDrop={()=>onDrop(et.key)}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <Pill color={et.color}>{et.label}</Pill>
                    <span className="text-xs text-slate-400">{cards.length}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {cards.map(c => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={()=>onDragStart(c.id)}
                      onClick={()=>setViewing(c)}
                      className={`kanban-card p-3 cursor-grab ${draggedId===c.id?"dragging":""}`}
                      data-testid={`prospect-card-${c.id}`}
                    >
                      <div className="text-sm font-semibold text-slate-800 truncate">{c.empresa}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{c.contacto_nombre || "—"}</div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs font-medium text-[#030447]">$ {(c.valor_estimado||0).toLocaleString()}</div>
                        <div className="text-[10px] text-slate-400">{c.probabilidad}%</div>
                      </div>
                    </div>
                  ))}
                  {cards.length === 0 && <div className="text-[11px] text-slate-300 text-center py-6">Sin prospectos</div>}
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
                <th className="text-left px-4 py-3">Empresa</th>
                <th className="text-left px-4 py-3">Contacto</th>
                <th className="text-left px-4 py-3">Etapa</th>
                <th className="text-right px-4 py-3">Valor</th>
                <th className="text-right px-4 py-3">Prob.</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50" data-testid={`prospect-row-${p.id}`}>
                  <td className="px-4 py-3 font-medium">{p.empresa}</td>
                  <td className="px-4 py-3 text-slate-600">{p.contacto_nombre || "—"}</td>
                  <td className="px-4 py-3"><Pill color={ETAPAS.find(e=>e.key===p.etapa)?.color || "slate"}>{ETAPAS.find(e=>e.key===p.etapa)?.label}</Pill></td>
                  <td className="px-4 py-3 text-right">$ {(p.valor_estimado||0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{p.probabilidad}%</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>setViewing(p)} className="text-xs text-[#6D4CC9] font-medium hover:underline">Ver</button>
                    <button onClick={()=>{ setEditing(p); setShowForm(true); }} className="text-xs text-slate-600 hover:underline">Editar</button>
                    <button onClick={()=>del(p.id)} className="text-xs text-rose-600 hover:underline">Eliminar</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan="6" className="py-12 text-center text-slate-400">Sin prospectos aún. Crea tu primero.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ProspectForm
          initial={editing}
          onClose={()=>setShowForm(false)}
          onSaved={load}
        />
      )}
      {viewing && (
        <ProspectDetail
          prospect={viewing}
          onClose={()=>setViewing(null)}
          onUpdate={load}
        />
      )}
    </div>
  );
}
