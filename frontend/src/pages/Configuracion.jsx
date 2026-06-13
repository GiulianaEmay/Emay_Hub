import React from "react";
import { SectionTitle, Btn, Pill } from "@/components/UI";
import { useAuth } from "@/lib/auth";

export default function Configuracion() {
  const { user } = useAuth();
  return (
    <div data-testid="config-page">
      <SectionTitle title="Configuración" subtitle="Preferencias generales" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="emay-card p-6">
          <h3 className="text-base font-semibold mb-4">Perfil</h3>
          <div className="flex items-center gap-3 mb-4">
            {user?.picture ? (
              <img src={user.picture} alt="" className="w-14 h-14 rounded-full" />
            ) : (
              <div className="w-14 h-14 rounded-full emay-gradient grid place-items-center text-white font-bold text-xl">{user?.name?.[0]}</div>
            )}
            <div>
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-slate-500">{user?.email}</div>
            </div>
          </div>
          <Pill color="purple">Rol: {user?.role || "admin"}</Pill>
        </div>
        <div className="emay-card p-6">
          <h3 className="text-base font-semibold mb-2">EMAY Solution</h3>
          <p className="text-sm text-slate-500">Plataforma operativa interna. Versión 1.0 MVP.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><div className="text-xs text-slate-400 uppercase">Color principal</div><div className="flex items-center gap-2 mt-1"><div className="w-5 h-5 rounded bg-[#030447]"/> #030447</div></div>
            <div><div className="text-xs text-slate-400 uppercase">Acento</div><div className="flex items-center gap-2 mt-1"><div className="w-5 h-5 rounded bg-[#6D4CC9]"/> #6D4CC9</div></div>
          </div>
        </div>
        <div className="emay-card p-6 lg:col-span-2">
          <h3 className="text-base font-semibold mb-2">Funciones futuras</h3>
          <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
            <li>Auditoría detallada por entidad</li>
            <li>Versionado avanzado de Base de Conocimiento</li>
            <li>Cifrado AES de credenciales de acceso</li>
            <li>Integraciones (WhatsApp Business, Slack, Gmail)</li>
            <li>Roles y permisos granulares</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
