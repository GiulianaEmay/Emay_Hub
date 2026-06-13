import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X, Building2, Key, FileText, Users, Activity } from "lucide-react";
import { toast } from "sonner";

function ClientForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    empresa: "", razon_social: "", ruc: "", rubro: "", pagina_web: "",
    direccion: "", ciudad: "", contacto_principal: "", cargo: "",
    telefono: "", correo: "", estado: "activo", notas: "", ticket_promedio: 0
  });
  const change = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (initial?.id) {
        await api.patch(`/clients/${initial.id}`, form);
        toast.success("Cliente actualizado");
      } else {
        await api.post("/clients", form);
        toast.success("Cliente creado");
      }
      onSaved(); onClose();
    } catch { toast.error("Error al guardar"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scroll"
        data-testid="client-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{initial?.id ? "Editar Cliente" : "Nuevo Cliente"}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 grid grid-cols-2 gap-4">
          {[
            ["empresa","Empresa *"],["razon_social","Razón Social"],["ruc","RUC"],["rubro","Rubro"],
            ["pagina_web","Página web"],["ciudad","Ciudad"],["direccion","Dirección"],["contacto_principal","Contacto principal"],
            ["cargo","Cargo"],["telefono","Teléfono"],["correo","Correo"]
          ].map(([k,l])=>(
            <div key={k}>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">{l}</label>
              <input data-testid={`client-${k}`} required={k==="empresa"} value={form[k]||""}
                onChange={e=>change(k,e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"/>
            </div>
          ))}
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</label>
            <select value={form.estado} onChange={e=>change("estado", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none">
              <option value="activo">Activo</option><option value="inactivo">Inactivo</option><option value="suspendido">Suspendido</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Notas</label>
            <textarea value={form.notas||""} onChange={e=>change("notas",e.target.value)} rows={3}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm"/>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-client-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

function ClientDetail({ client, onClose, onUpdate }) {
  const [tab, setTab] = useState("general");
  const [newAcceso, setNewAcceso] = useState({ plataforma: "", url: "", usuario: "", password: "" });
  const [newContacto, setNewContacto] = useState({ nombre: "", cargo: "", correo: "", telefono: "" });
  const [newServicio, setNewServicio] = useState({ nombre: "", descripcion: "", monto: 0, frecuencia: "mensual", estado: "activo", fecha_inicio: "" });
  const [interactions, setInteractions] = useState([]);

  useEffect(()=>{
    api.get(`/interactions?cliente_id=${client.id}`).then(r=>setInteractions(r.data)).catch(()=>{});
  }, [client.id]);

  const recalcIndicators = (servicios) => {
    const activos = servicios.filter(s => s.estado === "activo");
    const ticket = activos.length ? Math.round(activos.reduce((a,s)=>a + (parseFloat(s.monto)||0), 0) / activos.length) : 0;
    return { servicios_activos: activos.length, ticket_promedio: ticket };
  };

  const addAcceso = async () => {
    if (!newAcceso.plataforma) return;
    const accesos = [...(client.accesos || []), { ...newAcceso, id: Date.now() }];
    await api.patch(`/clients/${client.id}`, { accesos });
    setNewAcceso({ plataforma: "", url: "", usuario: "", password: "" });
    onUpdate();
    toast.success("Acceso guardado");
  };
  const addContacto = async () => {
    if (!newContacto.nombre) return;
    const contactos = [...(client.contactos || []), { ...newContacto, id: Date.now() }];
    await api.patch(`/clients/${client.id}`, { contactos });
    setNewContacto({ nombre: "", cargo: "", correo: "", telefono: "" });
    onUpdate();
    toast.success("Contacto agregado");
  };
  const addServicio = async () => {
    if (!newServicio.nombre) { toast.error("Nombre del servicio requerido"); return; }
    const servicios = [...(client.servicios || []), { ...newServicio, monto: parseFloat(newServicio.monto)||0, id: Date.now() }];
    const ind = recalcIndicators(servicios);
    await api.patch(`/clients/${client.id}`, { servicios, ...ind });
    setNewServicio({ nombre: "", descripcion: "", monto: 0, frecuencia: "mensual", estado: "activo", fecha_inicio: "" });
    onUpdate();
    toast.success("Servicio registrado");
  };
  const toggleServicio = async (id) => {
    const servicios = (client.servicios || []).map(s => s.id === id ? { ...s, estado: s.estado === "activo" ? "pausado" : "activo" } : s);
    const ind = recalcIndicators(servicios);
    await api.patch(`/clients/${client.id}`, { servicios, ...ind });
    onUpdate();
  };
  const deleteServicio = async (id) => {
    const servicios = (client.servicios || []).filter(s => s.id !== id);
    const ind = recalcIndicators(servicios);
    await api.patch(`/clients/${client.id}`, { servicios, ...ind });
    onUpdate();
    toast.success("Servicio eliminado");
  };

  const tabs = [
    { k: "general", l: "General" },
    { k: "contactos", l: "Contactos" },
    { k: "servicios", l: "Servicios" },
    { k: "accesos", l: "Accesos" },
    { k: "indicadores", l: "Indicadores" },
    { k: "timeline", l: "Timeline" },
  ];

  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scroll" data-testid="client-detail">
        <div className="px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg emay-gradient grid place-items-center text-white font-bold">
                {client.empresa[0]}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{client.empresa}</h3>
                <p className="text-xs text-slate-500">{client.rubro || "—"} · {client.ciudad || "—"}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-1 mt-4">
            {tabs.map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k)} data-testid={`tab-${t.k}`}
                className={`px-3 py-1.5 text-sm rounded-md ${tab===t.k?"bg-[#F5F3FF] text-[#030447] font-medium":"text-slate-500 hover:bg-slate-50"}`}>
                {t.l}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {tab === "general" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs text-slate-400 uppercase">Razón social</div>{client.razon_social || "—"}</div>
              <div><div className="text-xs text-slate-400 uppercase">RUC</div>{client.ruc || "—"}</div>
              <div><div className="text-xs text-slate-400 uppercase">Web</div>{client.pagina_web || "—"}</div>
              <div><div className="text-xs text-slate-400 uppercase">Estado</div><Pill color="green">{client.estado}</Pill></div>
              <div><div className="text-xs text-slate-400 uppercase">Teléfono</div>{client.telefono || "—"}</div>
              <div><div className="text-xs text-slate-400 uppercase">Correo</div>{client.correo || "—"}</div>
              <div className="col-span-2"><div className="text-xs text-slate-400 uppercase">Dirección</div>{client.direccion || "—"}</div>
              <div className="col-span-2"><div className="text-xs text-slate-400 uppercase">Notas</div>{client.notas || "—"}</div>
            </div>
          )}
          {tab === "contactos" && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-2">
                <input placeholder="Nombre" value={newContacto.nombre} onChange={e=>setNewContacto({...newContacto, nombre: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" data-testid="contact-name" />
                <input placeholder="Cargo" value={newContacto.cargo} onChange={e=>setNewContacto({...newContacto, cargo: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                <input placeholder="Correo" value={newContacto.correo} onChange={e=>setNewContacto({...newContacto, correo: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                <input placeholder="Teléfono" value={newContacto.telefono} onChange={e=>setNewContacto({...newContacto, telefono: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                <Btn onClick={addContacto} className="col-span-2" data-testid="save-contact-btn"><Plus className="w-4 h-4" /> Agregar contacto</Btn>
              </div>
              <div className="space-y-2">
                {(client.contactos || []).map((c,i)=>(
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-100">
                    <div>
                      <div className="font-medium text-sm">{c.nombre}</div>
                      <div className="text-xs text-slate-500">{c.cargo} · {c.correo}</div>
                    </div>
                    <div className="text-xs text-slate-400">{c.telefono}</div>
                  </div>
                ))}
                {(client.contactos || []).length === 0 && <div className="text-xs text-slate-400 text-center py-4">Sin contactos</div>}
              </div>
            </div>
          )}
          {tab === "accesos" && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-2">
                <input placeholder="Plataforma" value={newAcceso.plataforma} onChange={e=>setNewAcceso({...newAcceso, plataforma: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" data-testid="acceso-plataforma" />
                <input placeholder="URL" value={newAcceso.url} onChange={e=>setNewAcceso({...newAcceso, url: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                <input placeholder="Usuario" value={newAcceso.usuario} onChange={e=>setNewAcceso({...newAcceso, usuario: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                <input placeholder="Contraseña" type="password" value={newAcceso.password} onChange={e=>setNewAcceso({...newAcceso, password: e.target.value})}
                  className="px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                <Btn onClick={addAcceso} className="col-span-2" data-testid="save-acceso-btn"><Key className="w-4 h-4" /> Guardar acceso</Btn>
              </div>
              <div className="space-y-2">
                {(client.accesos || []).map((a,i)=>(
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-white border border-slate-100">
                    <div>
                      <div className="font-medium text-sm">{a.plataforma}</div>
                      <div className="text-xs text-slate-500">{a.url} · {a.usuario}</div>
                    </div>
                    <Pill color="purple">●●●●●●</Pill>
                  </div>
                ))}
                {(client.accesos || []).length === 0 && <div className="text-xs text-slate-400 text-center py-4">Sin accesos guardados</div>}
              </div>
            </div>
          )}
          {tab === "servicios" && (
            <div className="space-y-3">
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-2">
                <input placeholder="Nombre del servicio" value={newServicio.nombre} onChange={e=>setNewServicio({...newServicio, nombre: e.target.value})}
                  className="col-span-2 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" data-testid="servicio-nombre" />
                <textarea placeholder="Descripción / alcance" value={newServicio.descripcion} onChange={e=>setNewServicio({...newServicio, descripcion: e.target.value})}
                  rows={2} className="col-span-2 px-3 py-2 rounded-md border border-slate-200 text-sm bg-white resize-none" />
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Monto (S/)</label>
                  <input type="number" min="0" step="0.01" placeholder="0" value={newServicio.monto}
                    onChange={e=>setNewServicio({...newServicio, monto: e.target.value})}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" data-testid="servicio-monto" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Frecuencia</label>
                  <select value={newServicio.frecuencia} onChange={e=>setNewServicio({...newServicio, frecuencia: e.target.value})}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white">
                    <option value="mensual">Mensual</option>
                    <option value="anual">Anual</option>
                    <option value="unico">Pago único</option>
                    <option value="por_hora">Por hora</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Fecha inicio</label>
                  <input type="date" value={newServicio.fecha_inicio}
                    onChange={e=>setNewServicio({...newServicio, fecha_inicio: e.target.value})}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Estado</label>
                  <select value={newServicio.estado} onChange={e=>setNewServicio({...newServicio, estado: e.target.value})}
                    className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm bg-white">
                    <option value="activo">Activo</option>
                    <option value="pausado">Pausado</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </div>
                <Btn onClick={addServicio} className="col-span-2" data-testid="save-servicio-btn"><Plus className="w-4 h-4" /> Registrar servicio</Btn>
              </div>

              <div className="space-y-2">
                {(client.servicios || []).length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-xs text-slate-400">Aún no hay servicios registrados</div>
                    <div className="text-[10px] text-slate-300 mt-1">Registra los servicios contratados arriba para alimentar los indicadores.</div>
                  </div>
                )}
                {(client.servicios || []).map(s => (
                  <div key={s.id} className="flex items-start justify-between p-4 rounded-lg bg-white border border-slate-100 hover:border-[#A38BFF] transition-colors" data-testid={`servicio-row-${s.id}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-sm text-slate-800">{s.nombre}</div>
                        <Pill color={s.estado==="activo"?"green":s.estado==="pausado"?"orange":"slate"}>{s.estado}</Pill>
                      </div>
                      {s.descripcion && <div className="text-xs text-slate-500 mt-1">{s.descripcion}</div>}
                      <div className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider">
                        {s.frecuencia} · desde {s.fecha_inicio || "—"}
                      </div>
                    </div>
                    <div className="text-right ml-3 shrink-0">
                      <div className="text-base font-bold text-[#030447]">S/ {Number(s.monto||0).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-400 mb-2">/{s.frecuencia}</div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={()=>toggleServicio(s.id)} className="text-[10px] text-slate-500 hover:text-[#030447] hover:underline">{s.estado==="activo"?"Pausar":"Activar"}</button>
                        <button onClick={()=>deleteServicio(s.id)} className="text-[10px] text-rose-600 hover:underline">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "indicadores" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="emay-card p-4">
                <div className="text-xs text-slate-400 uppercase">Ticket promedio</div>
                <div className="text-2xl font-bold mt-1">S/ {(client.ticket_promedio||0).toLocaleString()}</div>
              </div>
              <div className="emay-card p-4">
                <div className="text-xs text-slate-400 uppercase">Servicios activos</div>
                <div className="text-2xl font-bold mt-1">{client.servicios_activos || 0}</div>
              </div>
              <div className="emay-card p-4">
                <div className="text-xs text-slate-400 uppercase">Antigüedad</div>
                <div className="text-2xl font-bold mt-1">
                  {Math.max(0, Math.floor((Date.now() - new Date(client.fecha_alta).getTime())/(1000*60*60*24)))} d
                </div>
              </div>
              <div className="emay-card p-4">
                <div className="text-xs text-slate-400 uppercase">Estado contractual</div>
                <div className="text-2xl font-bold mt-1 capitalize">{client.estado}</div>
              </div>
            </div>
          )}
          {tab === "timeline" && (
            <div className="space-y-2">
              {interactions.length === 0 && <div className="text-xs text-slate-400 text-center py-4">Sin actividad registrada</div>}
              {interactions.map(i=>(
                <div key={i.id} className="flex items-start gap-3 p-3 rounded-md bg-slate-50">
                  <div className="w-7 h-7 rounded bg-[#F5F3FF] grid place-items-center"><Activity className="w-3.5 h-3.5 text-[#6D4CC9]" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{i.titulo}</div>
                    {i.descripcion && <div className="text-xs text-slate-500 mt-0.5">{i.descripcion}</div>}
                    <div className="text-[10px] text-slate-400 mt-1 uppercase">{i.tipo} · {new Date(i.fecha).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Clientes() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    try { const r = await api.get("/clients"); setItems(r.data); } catch {}
  };
  useEffect(()=>{ load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar cliente?")) return;
    await api.delete(`/clients/${id}`);
    setItems(p => p.filter(x => x.id !== id));
    toast.success("Eliminado");
  };

  return (
    <div data-testid="clientes-page">
      <SectionTitle
        title="Clientes"
        subtitle="Toda la información centralizada por cliente"
        action={
          <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-client-btn">
            <Plus className="w-4 h-4" /> Nuevo Cliente
          </Btn>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(c => (
          <div key={c.id} className="emay-card p-5 cursor-pointer" onClick={()=>setViewing(c)} data-testid={`client-card-${c.id}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg emay-gradient grid place-items-center text-white font-bold">
                {c.empresa[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-800 truncate">{c.empresa}</div>
                <div className="text-xs text-slate-500 truncate">{c.contacto_principal || "—"}</div>
              </div>
              <Pill color={c.estado==="activo"?"green":"slate"}>{c.estado}</Pill>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-slate-400 uppercase tracking-wider text-[10px]">Rubro</div>
                <div className="text-slate-700">{c.rubro || "—"}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase tracking-wider text-[10px]">Ciudad</div>
                <div className="text-slate-700">{c.ciudad || "—"}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase tracking-wider text-[10px]">Ticket prom.</div>
                <div className="text-slate-700">S/ {(c.ticket_promedio||0).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-400 uppercase tracking-wider text-[10px]">Servicios</div>
                <div className="text-slate-700">{c.servicios_activos || 0}</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button onClick={(e)=>{e.stopPropagation(); setEditing(c); setShowForm(true); }} className="text-slate-600 hover:underline">Editar</button>
              <button onClick={(e)=>{e.stopPropagation(); del(c.id);}} className="text-rose-600 hover:underline">Eliminar</button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full">
            <EmptyState title="Aún no hay clientes" subtitle="Crea tu primer cliente para empezar a gestionarlo." action={
              <Btn onClick={()=>{ setEditing(null); setShowForm(true); }}><Plus className="w-4 h-4" /> Nuevo Cliente</Btn>
            } />
          </div>
        )}
      </div>

      {showForm && <ClientForm initial={editing} onClose={()=>setShowForm(false)} onSaved={load} />}
      {viewing && <ClientDetail client={viewing} onClose={()=>setViewing(null)} onUpdate={async ()=>{ await load(); const r=await api.get(`/clients/${viewing.id}`); setViewing(r.data); }} />}
    </div>
  );
}
