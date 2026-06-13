import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Toaster } from "sonner";

import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import CRM from "@/pages/CRM";
import Clientes from "@/pages/Clientes";
import Proyectos from "@/pages/Proyectos";
import Procesos from "@/pages/Procesos";
import ProcesoDetail from "@/pages/ProcesoDetail";
import Tareas from "@/pages/Tareas";
import Soporte from "@/pages/Soporte";
import Conocimiento from "@/pages/Conocimiento";
import Equipo from "@/pages/Equipo";
import Configuracion from "@/pages/Configuracion";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#FAFAFB]">
        <div className="w-10 h-10 border-4 border-[#EAE5FF] border-t-[#6D4CC9] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const location = useLocation();
  // Sync session_id detection - process auth callback before anything else
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/proyectos" element={<Proyectos />} />
        <Route path="/procesos" element={<Procesos />} />
        <Route path="/procesos/:id" element={<ProcesoDetail />} />
        <Route path="/tareas" element={<Tareas />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/conocimiento" element={<Conocimiento />} />
        <Route path="/equipo" element={<Equipo />} />
        <Route path="/configuracion" element={<Configuracion />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </BrowserRouter>
  );
}
