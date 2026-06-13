import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill, EmptyState } from "@/components/UI";
import { Plus, X, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";

const CATS = [
  { k: "sop", l: "SOP" },
  { k: "manuales", l: "Manuales" },
  { k: "implementaciones", l: "Implementaciones" },
  { k: "configuraciones", l: "Configuraciones" },
  { k: "casos_exito", l: "Casos de éxito" },
  { k: "plantillas", l: "Plantillas" },
  { k: "faqs", l: "FAQs" },
];

function KBForm({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || {
    titulo: "", categoria: "manuales", contenido: "", tags: []
  });
  const [tagInput, setTagInput] = useState("");
  const change = (k,v) => setForm(p=>({...p, [k]: v}));
  const addTag = () => {
    if (!tagInput.trim()) return;
    change("tags", [...(form.tags||[]), tagInput.trim()]);
    setTagInput("");
  };
  const submit = async (e) => {
    e.preventDefault();
    try {
      if (initial?.id) await api.patch(`/kb/${initial.id}`, form);
      else await api.post("/kb", form);
      toast.success("Artículo guardado"); onSaved(); onClose();
    } catch { toast.error("Error"); }
  };
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <form onClick={e=>e.stopPropagation()} onSubmit={submit}
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scroll" data-testid="kb-form">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <h3 className="text-lg font-semibold">{initial?.id?"Editar":"Nuevo"} Artículo</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Título *</label>
            <input required value={form.titulo} onChange={e=>change("titulo",e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm" data-testid="kb-titulo" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
            <select value={form.categoria} onChange={e=>change("categoria", e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm">
              {CATS.map(c=><option key={c.k} value={c.k}>{c.l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Etiquetas</label>
            <div className="mt-1 flex flex-wrap gap-2 mb-2">
              {(form.tags||[]).map((t,i)=>(
                <span key={i} className="bg-[#F5F3FF] text-[#2D144D] px-2 py-0.5 rounded text-xs flex items-center gap-1">
                  {t}
                  <button type="button" onClick={()=>change("tags", form.tags.filter((_,idx)=>idx!==i))}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault(); addTag();}}}
                placeholder="Agregar tag y presionar Enter"
                className="flex-1 px-3 py-2 rounded-md border border-slate-200 text-sm" />
              <Btn type="button" variant="secondary" onClick={addTag}>Agregar</Btn>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Contenido (Markdown)</label>
            <textarea value={form.contenido||""} onChange={e=>change("contenido",e.target.value)} rows={12}
              className="mt-1 w-full px-3 py-2 rounded-md border border-slate-200 text-sm font-mono" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <Btn variant="outline" type="button" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" type="submit" data-testid="save-kb-btn">Guardar</Btn>
        </div>
      </form>
    </div>
  );
}

function KBView({ article, onClose, onEdit }) {
  return (
    <div className="fixed inset-0 bg-black/30 z-50 grid place-items-center p-4" onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto thin-scroll" data-testid="kb-view">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <Pill color="purple">{CATS.find(c=>c.k===article.categoria)?.l || article.categoria}</Pill>
            <h3 className="text-xl font-semibold mt-2">{article.titulo}</h3>
            <div className="text-xs text-slate-400 mt-1">v{article.version} · {article.autor || "—"}</div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {(article.tags||[]).map((t,i)=><span key={i} className="text-xs bg-slate-100 px-2 py-0.5 rounded">{t}</span>)}
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{article.contenido}</pre>
        </div>
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end">
          <Btn variant="secondary" onClick={onEdit}>Editar</Btn>
        </div>
      </div>
    </div>
  );
}

export default function Conocimiento() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todos");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    const r = await api.get("/kb"); setItems(r.data);
  };
  useEffect(()=>{ load(); }, []);

  const del = async (id) => {
    if (!confirm("¿Eliminar artículo?")) return;
    await api.delete(`/kb/${id}`);
    setItems(p=>p.filter(x=>x.id!==id));
  };

  const filtered = items.filter(i =>
    (cat==="todos" || i.categoria===cat) &&
    (!q || i.titulo.toLowerCase().includes(q.toLowerCase()) || (i.tags||[]).some(t=>t.toLowerCase().includes(q.toLowerCase())))
  );

  return (
    <div data-testid="kb-page">
      <SectionTitle title="Base de Conocimiento" subtitle="Memoria corporativa de EMAY"
        action={
          <Btn variant="primary" onClick={()=>{ setEditing(null); setShowForm(true); }} data-testid="new-kb-btn">
            <Plus className="w-4 h-4" /> Nuevo Artículo
          </Btn>
        }
      />

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar por título o tag…"
            className="bg-transparent outline-none text-sm flex-1" data-testid="kb-search" />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={()=>setCat("todos")} className={`px-3 py-1.5 text-xs rounded-md ${cat==="todos"?"bg-[#F5F3FF] text-[#2D144D] font-medium":"text-slate-500"}`}>Todos</button>
          {CATS.map(c=>(
            <button key={c.k} onClick={()=>setCat(c.k)}
              className={`px-3 py-1.5 text-xs rounded-md ${cat===c.k?"bg-[#F5F3FF] text-[#2D144D] font-medium":"text-slate-500"}`}>
              {c.l}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(a=>(
          <div key={a.id} className="emay-card p-5 cursor-pointer" onClick={()=>setViewing(a)} data-testid={`kb-card-${a.id}`}>
            <div className="flex items-start justify-between">
              <Pill color="purple">{CATS.find(c=>c.k===a.categoria)?.l || a.categoria}</Pill>
              <div className="text-[10px] text-slate-400">v{a.version}</div>
            </div>
            <h4 className="mt-3 font-semibold text-slate-800">{a.titulo}</h4>
            <div className="text-xs text-slate-500 mt-1 line-clamp-3">{a.contenido}</div>
            <div className="mt-3 flex flex-wrap gap-1">
              {(a.tags||[]).slice(0,4).map((t,i)=><span key={i} className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">{t}</span>)}
            </div>
            <div className="flex justify-end gap-2 mt-3 text-xs">
              <button onClick={(e)=>{e.stopPropagation(); setEditing(a); setShowForm(true);}} className="text-slate-600 hover:underline">Editar</button>
              <button onClick={(e)=>{e.stopPropagation(); del(a.id);}} className="text-rose-600 hover:underline">Eliminar</button>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div className="col-span-full">
            <EmptyState title="Sin artículos" subtitle="Crea tu primer artículo de conocimiento." />
          </div>
        )}
      </div>

      {showForm && <KBForm initial={editing} onClose={()=>setShowForm(false)} onSaved={load} />}
      {viewing && <KBView article={viewing} onClose={()=>setViewing(null)} onEdit={()=>{ setEditing(viewing); setViewing(null); setShowForm(true); }} />}
    </div>
  );
}
