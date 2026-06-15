import React from "react";
import { Target, Cog, Rocket } from "lucide-react";

export default function Login() {
  const handleGoogle = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const goldenCircle = [
    {
      icon: Target,
      title: "Por qué",
      body: "Creemos que toda empresa merece operar con la velocidad, precisión y escalabilidad que solo la tecnología bien aplicada puede brindar."
    },
    {
      icon: Cog,
      title: "Cómo",
      body: "Diseñamos, integramos y automatizamos procesos críticos con IA, software a medida y arquitecturas cloud — adaptadas al ADN de cada negocio."
    },
    {
      icon: Rocket,
      title: "Qué",
      body: "Implementamos transformación digital end-to-end: CRM, automatizaciones, plataformas web, agentes de IA y soluciones de gestión empresarial."
    }
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* LEFT - brand */}
      <div className="emay-gradient relative overflow-hidden hidden md:flex flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(163,139,255,0.25) 0, transparent 50%)"
        }} />

        <div className="relative z-10">
          <div className="inline-flex items-baseline gap-2 mb-10">
            <span className="text-4xl font-extrabold tracking-[0.2em] text-white" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
              EMAY
            </span>
            <span className="text-xs text-white/60 uppercase tracking-[0.2em] font-medium">
              Tech
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            Soluciones<br/>tecnológicas
          </h1>
          <p className="text-white/75 mt-5 max-w-md text-base">
            Transformamos operaciones empresariales mediante automatización, inteligencia artificial e ingeniería de software de precisión.
          </p>

          {/* Golden Circle */}
          <div className="mt-10 space-y-5 max-w-md">
            {goldenCircle.map((g, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm grid place-items-center shrink-0 border border-white/15">
                  <g.icon className="w-4.5 h-4.5 text-[#A38BFF]" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#A38BFF] font-bold">{g.title}</div>
                  <p className="text-sm text-white/85 mt-1 leading-relaxed">{g.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-[10px] text-white/50 uppercase tracking-[0.2em]">
          Integraciones & Automatizaciones · © EMAY Tech
        </div>
      </div>

      {/* RIGHT - login */}
      <div className="flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-10">
            <div className="inline-flex items-baseline gap-2">
              <span className="text-3xl font-extrabold tracking-[0.2em] text-[#030447]" style={{ fontFamily: "'Cabinet Grotesk', sans-serif" }}>
                EMAY
              </span>
              <span className="text-xs text-slate-500 uppercase tracking-[0.2em]">Tech</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Bienvenido</h2>
          <p className="text-sm text-slate-500 mt-2">Inicia sesión para acceder a la plataforma operativa.</p>

          <button
            data-testid="login-google-btn"
            onClick={handleGoogle}
            className="mt-10 w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:border-[#6D4CC9] hover:bg-[#FAFAFB] transition-all font-medium text-slate-700"
          >
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4c-7.9 0-14.7 4.6-18 11.3z"/><path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.4l-6.3-5.2c-2 1.4-4.6 2.3-7.4 2.3-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.2 39.4 16 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.4l6.3 5.2C41.3 35.6 44 30.3 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
            Continuar con Google
          </button>

          <p className="mt-8 text-[10px] text-slate-400 text-center uppercase tracking-[0.18em]">
            Plataforma interna · Sólo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}
