import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { SectionTitle, Btn, Pill } from "@/components/UI";
import { ArrowLeft, Sparkles, Send, FileText, Workflow as WflowIcon, Lightbulb } from "lucide-react";
import { toast } from "sonner";

function BpmnDiagram({ bpmn }) {
  if (!bpmn || !bpmn.nodes?.length) {
    return <div className="text-sm text-slate-400 text-center py-8">Sin diagrama disponible.</div>;
  }
  const nodes = bpmn.nodes;
  const edges = bpmn.edges || [];
  // Simple horizontal layout
  const W = 160, H = 60, GAP = 60;
  const positions = {};
  nodes.forEach((n, i) => {
    positions[n.id] = { x: 30 + i * (W + GAP), y: 80 };
  });
  const totalW = 30 + nodes.length * (W + GAP);

  const nodeColor = (t) => {
    if (t === "start") return "#10B981";
    if (t === "end") return "#EF4444";
    if (t === "decision") return "#F59E0B";
    return "#6D4CC9";
  };

  return (
    <div className="overflow-x-auto thin-scroll">
      <svg width={Math.max(totalW, 600)} height="220" className="bg-white">
        {edges.map((e, i) => {
          const a = positions[e.from], b = positions[e.to];
          if (!a || !b) return null;
          const x1 = a.x + W, y1 = a.y + H/2;
          const x2 = b.x, y2 = b.y + H/2;
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2-6} y2={y2} stroke="#A38BFF" strokeWidth="2" markerEnd="url(#arrow)" />
              {e.label && <text x={(x1+x2)/2} y={y1-8} textAnchor="middle" fontSize="10" fill="#6B7280">{e.label}</text>}
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#A38BFF" />
          </marker>
        </defs>
        {nodes.map((n, i) => {
          const p = positions[n.id];
          if (n.type === "decision") {
            return (
              <g key={n.id}>
                <polygon
                  points={`${p.x+W/2},${p.y} ${p.x+W},${p.y+H/2} ${p.x+W/2},${p.y+H} ${p.x},${p.y+H/2}`}
                  fill={nodeColor(n.type)} opacity="0.9"
                />
                <text x={p.x+W/2} y={p.y+H/2+4} textAnchor="middle" fontSize="11" fill="white" fontWeight="600">{n.label.slice(0, 18)}</text>
              </g>
            );
          }
          if (n.type === "start" || n.type === "end") {
            return (
              <g key={n.id}>
                <ellipse cx={p.x+W/2} cy={p.y+H/2} rx={W/2-10} ry={H/2} fill={nodeColor(n.type)} />
                <text x={p.x+W/2} y={p.y+H/2+4} textAnchor="middle" fontSize="11" fill="white" fontWeight="600">{n.label}</text>
              </g>
            );
          }
          return (
            <g key={n.id}>
              <rect x={p.x} y={p.y} width={W} height={H} rx="8" fill={nodeColor(n.type)} opacity="0.95" />
              <text x={p.x+W/2} y={p.y+H/2+4} textAnchor="middle" fontSize="11" fill="white" fontWeight="600">
                {n.label.length > 22 ? n.label.slice(0,22)+"…" : n.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function ProcesoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proc, setProc] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState("chat");
  const scrollRef = useRef(null);

  const load = async () => {
    try { const r = await api.get(`/processes/${id}`); setProc(r.data); }
    catch { toast.error("Error cargando proceso"); }
  };
  useEffect(()=>{ load(); }, [id]);

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [proc?.messages?.length]);

  const send = async () => {
    if (!text.trim() || sending) return;
    const t = text.trim();
    setText(""); setSending(true);
    // optimistic
    setProc(p => ({...p, messages: [...(p.messages||[]), { role: "user", content: t, ts: new Date().toISOString() }]}));
    try {
      const r = await api.post(`/processes/${id}/message`, { text: t });
      setProc(p => ({...p, messages: [...(p.messages||[]), { role: "assistant", content: r.data.message, ts: new Date().toISOString() }],
                          estado: r.data.interview_done ? "lista_para_generar" : p.estado }));
      if (r.data.interview_done) toast.success("Entrevista completada. Ya puedes generar la documentación.");
    } catch {
      toast.error("Error al enviar mensaje");
    }
    setSending(false);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      await api.post(`/processes/${id}/generate`);
      await load();
      toast.success("Documentación generada");
      setTab("sipoc");
    } catch { toast.error("Error generando documentación"); }
    setGenerating(false);
  };

  if (!proc) return <div className="text-slate-500">Cargando…</div>;

  const s = proc.summary || {};
  const tabs = [
    { k: "chat", l: "Entrevista", icon: Sparkles },
    { k: "sipoc", l: "SIPOC", icon: FileText },
    { k: "bpmn", l: "BPMN", icon: WflowIcon },
    { k: "asis", l: "AS-IS", icon: FileText },
    { k: "tobe", l: "TO-BE", icon: FileText },
    { k: "automation", l: "Automatización", icon: Lightbulb },
  ];

  return (
    <div data-testid="process-detail-page">
      <button onClick={()=>navigate("/procesos")} className="text-sm text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 mb-3"><ArrowLeft className="w-4 h-4" /> Volver</button>
      <SectionTitle
        title={proc.nombre_proceso}
        subtitle={`${proc.area || "—"} · ${proc.cliente_nombre || "Interno"}`}
        action={
          proc.estado === "lista_para_generar" || proc.estado === "generado" ? (
            <Btn variant="primary" onClick={generate} disabled={generating} data-testid="generate-doc-btn">
              <Sparkles className="w-4 h-4" /> {generating ? "Generando…" : (proc.estado==="generado"?"Regenerar":"Generar documentación")}
            </Btn>
          ) : null
        }
      />

      <div className="flex gap-1 mb-4 border-b border-slate-100 overflow-x-auto thin-scroll">
        {tabs.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} data-testid={`tab-${t.k}`}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 ${tab===t.k?"border-[#030447] text-[#030447] font-medium":"border-transparent text-slate-500"}`}>
            <t.icon className="w-4 h-4" /> {t.l}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <div className="emay-card overflow-hidden flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
          <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll p-6 space-y-3">
            {(proc.messages||[]).map((m,i)=>(
              <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                  m.role==="user" ? "bg-[#030447] text-white rounded-br-sm" : "bg-[#F5F3FF] text-[#030447] rounded-bl-sm"
                }`}>
                  {m.content.split('\n').map((line,idx)=>(
                    <div key={idx}>{line || "\u00A0"}</div>
                  ))}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-[#F5F3FF] px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#6D4CC9] rounded-full live-dot" />
                    <div className="w-2 h-2 bg-[#6D4CC9] rounded-full live-dot" style={{animationDelay:"0.3s"}} />
                    <div className="w-2 h-2 bg-[#6D4CC9] rounded-full live-dot" style={{animationDelay:"0.6s"}} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 p-4 bg-white">
            <div className="flex items-center gap-2">
              <textarea
                data-testid="chat-input"
                value={text}
                onChange={e=>setText(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); send(); } }}
                placeholder="Escribe tu respuesta a la IA…"
                rows={1}
                className="flex-1 resize-none px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-[#6D4CC9] outline-none"
              />
              <Btn variant="primary" onClick={send} disabled={sending} data-testid="send-message-btn">
                <Send className="w-4 h-4" />
              </Btn>
            </div>
            <div className="text-[10px] text-slate-400 mt-2">Presiona Enter para enviar · Shift+Enter para nueva línea</div>
          </div>
        </div>
      )}

      {tab === "sipoc" && (
        <div className="emay-card p-6">
          {!s.sipoc ? <div className="text-sm text-slate-400 text-center py-12">Genera la documentación para ver el SIPOC.</div> : (
            <div className="grid grid-cols-5 gap-3">
              {[
                ["Suppliers", s.sipoc.suppliers, "#030447"],
                ["Inputs", s.sipoc.inputs, "#340b5b"],
                ["Process", s.sipoc.process, "#6D4CC9"],
                ["Outputs", s.sipoc.outputs, "#A38BFF"],
                ["Customers", s.sipoc.customers, "#C7B8FF"],
              ].map(([title, arr, color])=>(
                <div key={title}>
                  <div className="px-3 py-2 rounded-t-lg text-white text-xs font-bold tracking-wider uppercase" style={{background: color}}>{title}</div>
                  <div className="border border-slate-100 rounded-b-lg p-3 space-y-2 min-h-[200px]">
                    {(arr||[]).map((it,i)=>(
                      <div key={i} className="text-xs text-slate-700 leading-snug">• {it}</div>
                    ))}
                    {(arr||[]).length===0 && <div className="text-xs text-slate-300">—</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "bpmn" && (
        <div className="emay-card p-6">
          <BpmnDiagram bpmn={s.bpmn} />
        </div>
      )}

      {tab === "asis" && (
        <div className="emay-card p-6">
          <div className="prose-emay max-w-none">
            {s.as_is ? <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{s.as_is}</pre>
              : <div className="text-sm text-slate-400 text-center py-12">Genera la documentación para ver el AS-IS.</div>}
          </div>
        </div>
      )}

      {tab === "tobe" && (
        <div className="emay-card p-6">
          <div className="prose-emay max-w-none">
            {s.to_be ? <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{s.to_be}</pre>
              : <div className="text-sm text-slate-400 text-center py-12">Genera la documentación para ver el TO-BE.</div>}
          </div>
        </div>
      )}

      {tab === "automation" && (
        <div className="space-y-3">
          {!s.automation_opportunities?.length ? (
            <div className="emay-card p-12 text-center text-slate-400 text-sm">Genera la documentación para ver las oportunidades de automatización.</div>
          ) : s.automation_opportunities.map((op,i)=>(
            <div key={i} className="emay-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-[#6D4CC9]" />
                    <h4 className="font-semibold text-slate-800">{op.titulo}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{op.descripcion}</p>
                  {op.herramientas_sugeridas?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {op.herramientas_sugeridas.map((h,j)=><span key={j} className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded">{h}</span>)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Pill color={op.impacto==="alto"?"green":op.impacto==="medio"?"orange":"slate"}>Impacto: {op.impacto}</Pill>
                  <Pill color={op.esfuerzo==="alto"?"red":op.esfuerzo==="medio"?"orange":"green"}>Esfuerzo: {op.esfuerzo}</Pill>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
