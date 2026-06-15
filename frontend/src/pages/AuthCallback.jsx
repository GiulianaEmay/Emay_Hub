import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const hash = window.location.hash;
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) {
      navigate("/login");
      return;
    }
    const session_id = match[1];
    (async () => {
      try {
        const r = await api.post("/auth/session", { session_id });
        // Guardar token como fallback Bearer (cookies cross-site pueden no persistir)
        if (r.data.session_token) {
          localStorage.setItem("emay_session_token", r.data.session_token);
        }
        setUser(r.data.user);
        // Strip hash & redirect
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { state: { user: r.data.user } });
      } catch (e) {
        console.error(e);
        navigate("/login");
      }
    })();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center emay-gradient">
      <div className="text-white text-center">
        <div className="w-12 h-12 mx-auto border-4 border-white/30 border-t-white rounded-full animate-spin mb-4"></div>
        <p className="font-medium" data-testid="auth-callback-loading">Iniciando sesión…</p>
      </div>
    </div>
  );
}
