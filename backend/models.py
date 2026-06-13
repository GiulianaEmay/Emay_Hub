"""Pydantic models and MongoDB helpers for EMAY HUB."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}" if prefix else uuid.uuid4().hex[:12]


# ---------- User ----------
class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "admin"
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- Prospect (CRM) ----------
class Prospect(BaseModel):
    id: str = Field(default_factory=lambda: new_id("prosp_"))
    empresa: str
    razon_social: Optional[str] = ""
    ruc: Optional[str] = ""
    rubro: Optional[str] = ""
    tamano: Optional[str] = ""
    pagina_web: Optional[str] = ""
    direccion: Optional[str] = ""
    ciudad: Optional[str] = ""
    contacto_nombre: Optional[str] = ""
    cargo: Optional[str] = ""
    telefono: Optional[str] = ""
    whatsapp: Optional[str] = ""
    correo: Optional[str] = ""
    linkedin: Optional[str] = ""
    fuente: Optional[str] = ""
    responsable: Optional[str] = ""
    valor_estimado: float = 0.0
    probabilidad: int = 0
    etapa: str = "prospecto"  # prospecto, contactado, reunion, diagnostico, propuesta, negociacion, ganado, perdido
    notas: Optional[str] = ""
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


class Interaction(BaseModel):
    id: str = Field(default_factory=lambda: new_id("intr_"))
    prospect_id: Optional[str] = None
    cliente_id: Optional[str] = None
    tipo: str  # llamada, correo, whatsapp, reunion, visita, demo
    titulo: str
    descripcion: Optional[str] = ""
    fecha: str = Field(default_factory=utcnow_iso)
    responsable: Optional[str] = ""
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- Client ----------
class Client(BaseModel):
    id: str = Field(default_factory=lambda: new_id("cli_"))
    empresa: str
    razon_social: Optional[str] = ""
    ruc: Optional[str] = ""
    rubro: Optional[str] = ""
    pagina_web: Optional[str] = ""
    direccion: Optional[str] = ""
    ciudad: Optional[str] = ""
    contacto_principal: Optional[str] = ""
    cargo: Optional[str] = ""
    telefono: Optional[str] = ""
    correo: Optional[str] = ""
    estado: str = "activo"  # activo, inactivo, suspendido
    fecha_alta: str = Field(default_factory=utcnow_iso)
    ticket_promedio: float = 0.0
    servicios_activos: int = 0
    notas: Optional[str] = ""
    contactos: List[Dict[str, Any]] = []
    accesos: List[Dict[str, Any]] = []  # plataforma, url, usuario, password, api_key
    indicadores: Dict[str, Any] = {}
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- Project ----------
class Project(BaseModel):
    id: str = Field(default_factory=lambda: new_id("proj_"))
    nombre: str
    cliente_id: Optional[str] = None
    cliente_nombre: Optional[str] = ""
    descripcion: Optional[str] = ""
    estado: str = "levantamiento"  # levantamiento, diseno, desarrollo, qa, implementacion, capacitacion, cerrado
    prioridad: str = "media"  # baja, media, alta, urgente
    responsable: Optional[str] = ""
    equipo: List[str] = []
    fecha_inicio: Optional[str] = None
    fecha_fin: Optional[str] = None
    progreso: int = 0
    entregables: List[Dict[str, Any]] = []
    riesgos: List[Dict[str, Any]] = []
    reuniones: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- Task ----------
class Task(BaseModel):
    id: str = Field(default_factory=lambda: new_id("task_"))
    titulo: str
    descripcion: Optional[str] = ""
    cliente_id: Optional[str] = None
    proyecto_id: Optional[str] = None
    responsable: Optional[str] = ""
    prioridad: str = "media"
    estado: str = "pendiente"  # pendiente, en_proceso, en_revision, completado
    fecha_limite: Optional[str] = None
    comentarios: List[Dict[str, Any]] = []
    adjuntos: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- Ticket (Support) ----------
class Ticket(BaseModel):
    id: str = Field(default_factory=lambda: new_id("tkt_"))
    titulo: str
    descripcion: Optional[str] = ""
    cliente_id: Optional[str] = None
    cliente_nombre: Optional[str] = ""
    categoria: str = "general"
    prioridad: str = "media"
    responsable: Optional[str] = ""
    estado: str = "nuevo"  # nuevo, asignado, en_proceso, esperando_cliente, cerrado
    historial: List[Dict[str, Any]] = []
    adjuntos: List[Dict[str, Any]] = []
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- Knowledge Base ----------
class KBArticle(BaseModel):
    id: str = Field(default_factory=lambda: new_id("kb_"))
    titulo: str
    categoria: str = "manuales"  # sop, manuales, implementaciones, configuraciones, casos_exito, plantillas, faqs
    contenido: str = ""
    tags: List[str] = []
    autor: Optional[str] = ""
    version: int = 1
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- Team ----------
class TeamMember(BaseModel):
    id: str = Field(default_factory=lambda: new_id("tm_"))
    nombre: str
    cargo: Optional[str] = ""
    especialidad: Optional[str] = ""
    correo: Optional[str] = ""
    telefono: Optional[str] = ""
    avatar: Optional[str] = ""
    activo: bool = True
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- Process Discovery (AI) ----------
class ProcessSession(BaseModel):
    id: str = Field(default_factory=lambda: new_id("ps_"))
    cliente_id: Optional[str] = None
    cliente_nombre: Optional[str] = ""
    nombre_proceso: str
    area: Optional[str] = ""
    estado: str = "entrevista"  # entrevista, generado, finalizado
    messages: List[Dict[str, Any]] = []  # role, content
    summary: Optional[Dict[str, Any]] = None  # sipoc, bpmn, as_is, to_be, automation
    created_at: str = Field(default_factory=utcnow_iso)
    updated_at: str = Field(default_factory=utcnow_iso)


# ---------- File ----------
class FileRecord(BaseModel):
    id: str = Field(default_factory=lambda: new_id("file_"))
    storage_path: str
    original_filename: str
    content_type: str
    size: int = 0
    owner_id: Optional[str] = None
    entity_type: Optional[str] = None  # cliente, proyecto, ticket, tarea, kb
    entity_id: Optional[str] = None
    is_deleted: bool = False
    created_at: str = Field(default_factory=utcnow_iso)


# ---------- Notification / Activity ----------
class Activity(BaseModel):
    id: str = Field(default_factory=lambda: new_id("act_"))
    actor: Optional[str] = ""
    action: str
    entity_type: str
    entity_id: Optional[str] = ""
    description: str
    created_at: str = Field(default_factory=utcnow_iso)
