# EMAY HUB - Product Requirements Document

## Original Problem Statement
EMAY HUB es la plataforma SaaS corporativa interna de EMAY Solution (empresa de transformación digital, automatización y desarrollo de software). Centraliza clientes, prospectos, proyectos, levantamiento de procesos con IA, tareas, soporte y conocimiento corporativo en una sola aplicación. No es un CRM tradicional sino una mezcla entre HubSpot + Notion + ClickUp + Monday + Zoho CRM, con identidad visual premium morada (#2D144D).

## Architecture
- **Frontend**: React 19 + Tailwind + Shadcn UI + Recharts + framer-motion + lucide-react. Layout: Sidebar fija (260px) + Topbar glassmorphism.
- **Backend**: FastAPI + Motor (async MongoDB) + emergentintegrations (Claude Sonnet 4.5 via Universal Key, Object Storage).
- **Auth**: Emergent Google OAuth (cookie + Bearer fallback, 7-day session).
- **AI**: Claude Sonnet 4.5 (claude-sonnet-4-5-20250929) for multi-turn interview + SIPOC/BPMN/AS-IS/TO-BE generation.
- **Storage**: Emergent Object Storage for file uploads.

## User Personas
1. **Admin EMAY (Gerencia)** - vista ejecutiva del negocio, KPIs, decisiones.
2. **Comercial** - gestión de prospectos y pipeline CRM.
3. **Project Manager** - proyectos, tareas y equipo.
4. **Consultor de Procesos** - usa el módulo de IA para levantamientos en clientes.
5. **Soporte** - gestión de tickets.

## Core Requirements (static)
- Sidebar con 10 módulos (Dashboard, CRM, Clientes, Proyectos, Procesos IA, Tareas, Soporte, KB, Equipo, Configuración)
- Identidad: #2D144D primario, paleta morada, tipografía Cabinet Grotesk + Manrope
- Login Google OAuth
- Multi-vista (Kanban / Lista) en CRM, Proyectos, Tareas
- Drag-and-drop nativo HTML5 en Kanban
- Búsqueda global en topbar
- Notificaciones / actividad reciente

## Implemented (2026-02-13)
- ✅ Autenticación con Emergent Google OAuth + sessión cookie + Bearer
- ✅ Layout completo (sidebar + topbar + search + notifs + perfil)
- ✅ Dashboard ejecutivo: 8 KPIs + 4 charts (embudo, estados proyectos, rubros, productividad) + timeline actividad
- ✅ CRM: pipeline Kanban 8 etapas con drag-and-drop, vista lista, formulario completo, ficha con interacciones (llamada/correo/whatsapp/reunion/visita/demo)
- ✅ Clientes: ficha 5 pestañas (general, contactos, accesos, indicadores, timeline)
- ✅ Proyectos: Kanban 7 estados + lista, formulario con cliente/equipo/fechas/progreso
- ✅ Levantamiento IA: entrevista conversacional Claude Sonnet 4.5 multi-turno, generación automática de SIPOC, BPMN (con diagrama SVG), AS-IS, TO-BE, oportunidades de automatización
- ✅ Tareas Kanban 4 estados + lista
- ✅ Soporte: tickets con filtros por estado
- ✅ Base de Conocimiento: 7 categorías, búsqueda, tags, versionado básico
- ✅ Equipo: cards con indicadores de carga calculados sobre proyectos/tareas reales
- ✅ Búsqueda global universal
- ✅ Actividad reciente / auditoría básica
- ✅ Object Storage (endpoint listo, UI a integrar)
- ✅ Seed demo idempotente

## Backlog (Prioritized)
### P1 (post-MVP)
- Cifrado AES-256 de credenciales de accesos
- Subida de archivos en UI (drag-drop + galería) - backend listo
- Notificaciones push en tiempo real (WebSocket)
- Roles y permisos granulares

### P2
- Versionado completo de Base de Conocimiento con diff
- Auditoría detallada por entidad
- Integraciones (WhatsApp Business API, Slack, Gmail)
- Calendario de proyectos compartido
- Reportes/exportación PDF de procesos generados

### P3
- Multi-tenancy (varias empresas)
- App móvil
- Análisis predictivo (close-rate, churn) con IA
