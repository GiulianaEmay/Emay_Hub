import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X, Workflow, Sparkles } from "lucide-react";
import { toast } from "sonner";

function NewProcessForm({ clients, onClose, onSaved }) {
  const [form, setForm] = useState({ nombre_proceso: "", area: "", cliente_id: "", cliente_nombre: "" });
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = { ...form };
      if (payload.cliente_id) {
        const cl = clients.find(c=>c.id===payload.cliente_id);
        if (cl) payload.cliente_nombre = cl.empresa;
      }
      const r = await api.post("/processes", payload);
      toast.success("Sesión creada. Iniciando entrevista…");
      onSaved(r.data);
      onClose();
    } catch { toast.error("Error"); }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg" data-testid="process-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Nuevo Levantamiento</h3>
            <p className="text-xs text-slate-500">La IA iniciará la entrevista contigo paso a paso.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre del proceso *</label>
            <input required value={form.nombre_proceso} onChange={e=>setForm({...form, nombre_proceso: e.target.value})}
              placeholder="Ej. Facturación electrónica"
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="process-nombre" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Área</label>
            <input value={form.area} onChange={e=>setForm({...form, area: e.target.value})}
              placeholder="Finanzas, Operaciones, RRHH…"
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Cliente</label>
            <select value={form.cliente_id} onChange={e=>setForm({...form, cliente_id: e.target.value})}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              <option value="">— Ninguno (interno) —</option>
              {clients.map(c=><option key={c.id} value={c.id}>{c.empresa}</option>)}
            </select>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" disabled={loading} data-testid="start-process-btn">
            <Sparkles className="w-4 h-4" /> {loading ? "Iniciando…" : "Iniciar entrevista"}
          </Btn>
        </div>
      </form>
    </div>
  );
}

const ESTADOS = {
  entrevista: { l: "En entrevista", c: "purple" },
  lista_para_generar: { l: "Lista para generar", c: "orange" },
  generado: { l: "Generado", c: "green" },
  finalizado: { l: "Finalizado", c: "slate" },
};

export default function Procesos() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    const [r,c] = await Promise.all([api.get("/processes"), api.get("/clients")]);
    setItems(r.data); setClients(c.data);
  };
  useEffect(()=>{ load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar levantamiento?")) return;
    await api.delete(`/processes/${id}`);
    setItems(p=>p.filter(x=>x.id!==id));
  };

  return (
    <div data-testid="procesos-page">
      <SectionTitle
        title="Levantamiento de Procesos con IA"
        subtitle="Entrevistas guiadas por IA · SIPOC · BPMN · AS-IS · TO-BE"
        action={
          <Btn variant="primary" onClick={()=>setShowForm(true)} data-testid="new-process-btn">
            <Plus className="w-4 h-4" /> Nuevo levantamiento
          </Btn>
        }
      />

      <div className="emay-card p-6 mb-6 bg-gradient-to-r from-[#F5F3FF] to-white border-[#DCD5F2]">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg emay-gradient grid place-items-center text-white">
            <Workflow className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-800">Documentación inteligente</h3>
            <p className="text-sm text-slate-600 mt-1">
              Inicia un nuevo levantamiento y la IA te entrevistará paso a paso para entender el proceso.
              Al finalizar generará automáticamente <strong>SIPOC</strong>, <strong>flujograma BPMN</strong>,
              documento <strong>AS-IS</strong> y <strong>TO-BE</strong>, además de oportunidades de automatización.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(p=>(
          <div key={p.id} className="emay-card p-5 cursor-pointer" onClick={()=>navigate(`/procesos/${p.id}`)} data-testid={`process-card-${p.id}`}>
            <div className="flex items-center justify-between">
              <Pill color={ESTADOS[p.estado]?.c || "slate"}>{ESTADOS[p.estado]?.l || p.estado}</Pill>
              <div className="text-[10px] text-slate-400 uppercase">{p.messages?.length || 0} mensajes</div>
            </div>
            <h4 className="mt-3 font-semibold text-slate-800">{p.nombre_proceso}</h4>
            <p className="text-xs text-slate-500 mt-1">{p.area || "—"} · {p.cliente_nombre || "Interno"}</p>
            <div className="mt-4 flex items-center justify-between text-xs">
              <span className="text-slate-400">{new Date(p.updated_at).toLocaleDateString()}</span>
              <button onClick={(e)=>{e.stopPropagation(); del(p.id);}} className="text-rose-600 hover:underline">Eliminar</button>
            </div>
          </div>
        ))}
        {items.length===0 && (
          <div className="col-span-full">
            <EmptyState
              title="Aún no hay procesos documentados"
              subtitle="Crea tu primer levantamiento y deja que la IA te guíe."
              action={<Btn onClick={()=>setShowForm(true)}><Sparkles className="w-4 h-4" /> Iniciar entrevista</Btn>}
            />
          </div>
        )}
      </div>

      {showForm && <NewProcessForm clients={clients} onClose={()=>setShowForm(false)} onSaved={(r)=>{ load(); navigate(`/procesos/${r.id}`); }} />}
    </div>
  );
}
