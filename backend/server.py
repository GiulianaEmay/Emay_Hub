"""EMAY HUB backend - FastAPI server."""
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Header, Query, Cookie
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import requests as http_requests
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from models import (
    User, Prospect, Interaction, Client, Project, Task, Ticket,
    KBArticle, TeamMember, ProcessSession, FileRecord, Activity,
    utcnow_iso, new_id,
)
from storage import init_storage, put_object, get_object, APP_NAME
import llm_service

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="EMAY HUB API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("emayhub")

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ============================================================
# AUTH
# ============================================================

async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
    session_token: Optional[str] = Cookie(None),
) -> User:
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user_doc)


@api.post("/auth/session")
async def auth_session(payload: Dict[str, Any], response: Response):
    """Exchange session_id from Emergent for session_token, set cookie."""
    session_id = payload.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    r = http_requests.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id}, timeout=15)
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = r.json()
    email = data["email"]
    name = data.get("name", email)
    picture = data.get("picture")
    session_token = data["session_token"]

    # Upsert user
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        user = User(user_id=f"user_{uuid.uuid4().hex[:12]}", email=email, name=name, picture=picture)
        await db.users.insert_one(user.model_dump())
        user_doc = user.model_dump()
    else:
        await db.users.update_one(
            {"email": email}, {"$set": {"name": name, "picture": picture}}
        )

    # Store session
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": utcnow_iso(),
    })

    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )
    return {"user": user_doc, "session_token": session_token}


@api.get("/auth/me")
async def auth_me(user: User = None, request: Request = None,
                  authorization: Optional[str] = Header(None),
                  session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, authorization, session_token)
    return user.model_dump()


@api.post("/auth/logout")
async def logout(response: Response,
                 authorization: Optional[str] = Header(None),
                 session_token: Optional[str] = Cookie(None)):
    token = session_token or (authorization.split(" ", 1)[1] if authorization and authorization.startswith("Bearer ") else None)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ============================================================
# Helper: log activity
# ============================================================
async def log_activity(actor: str, action: str, entity_type: str, entity_id: str, description: str):
    act = Activity(actor=actor, action=action, entity_type=entity_type, entity_id=entity_id, description=description)
    await db.activities.insert_one(act.model_dump())


# ============================================================
# PROSPECTS (CRM)
# ============================================================
@api.get("/prospects")
async def list_prospects(user: User = None,
                         request: Request = None,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    rows = await db.prospects.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return rows


@api.post("/prospects")
async def create_prospect(payload: Dict[str, Any], request: Request,
                          authorization: Optional[str] = Header(None),
                          session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    p = Prospect(**payload)
    await db.prospects.insert_one(p.model_dump())
    await log_activity(u.name, "creó", "prospecto", p.id, f"Nuevo prospecto: {p.empresa}")
    return p.model_dump()


@api.patch("/prospects/{pid}")
async def update_prospect(pid: str, payload: Dict[str, Any], request: Request,
                          authorization: Optional[str] = Header(None),
                          session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    await db.prospects.update_one({"id": pid}, {"$set": payload})
    row = await db.prospects.find_one({"id": pid}, {"_id": 0})
    if not row:
        raise HTTPException(404, "Prospect not found")
    await log_activity(u.name, "actualizó", "prospecto", pid, f"Cambios en {row.get('empresa', '')}")
    return row


@api.delete("/prospects/{pid}")
async def delete_prospect(pid: str, request: Request,
                          authorization: Optional[str] = Header(None),
                          session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.prospects.delete_one({"id": pid})
    return {"ok": True}


# ---- Interactions ----
@api.get("/interactions")
async def list_interactions(prospect_id: Optional[str] = None, cliente_id: Optional[str] = None,
                            request: Request = None,
                            authorization: Optional[str] = Header(None),
                            session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    q = {}
    if prospect_id: q["prospect_id"] = prospect_id
    if cliente_id: q["cliente_id"] = cliente_id
    return await db.interactions.find(q, {"_id": 0}).sort("fecha", -1).to_list(500)


@api.post("/interactions")
async def create_interaction(payload: Dict[str, Any], request: Request,
                             authorization: Optional[str] = Header(None),
                             session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    i = Interaction(**payload)
    await db.interactions.insert_one(i.model_dump())
    await log_activity(u.name, "registró", "interaccion", i.id, f"{i.tipo}: {i.titulo}")
    return i.model_dump()


# ============================================================
# CLIENTS
# ============================================================
@api.get("/clients")
async def list_clients(request: Request = None,
                       authorization: Optional[str] = Header(None),
                       session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.clients.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.get("/clients/{cid}")
async def get_client(cid: str, request: Request,
                     authorization: Optional[str] = Header(None),
                     session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    row = await db.clients.find_one({"id": cid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    return row


@api.post("/clients")
async def create_client(payload: Dict[str, Any], request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    c = Client(**payload)
    await db.clients.insert_one(c.model_dump())
    await log_activity(u.name, "creó", "cliente", c.id, f"Nuevo cliente: {c.empresa}")
    return c.model_dump()


@api.patch("/clients/{cid}")
async def update_client(cid: str, payload: Dict[str, Any], request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    await db.clients.update_one({"id": cid}, {"$set": payload})
    row = await db.clients.find_one({"id": cid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    await log_activity(u.name, "actualizó", "cliente", cid, f"Cambios en {row.get('empresa','')}")
    return row


@api.delete("/clients/{cid}")
async def delete_client(cid: str, request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.clients.delete_one({"id": cid})
    return {"ok": True}


# ============================================================
# PROJECTS
# ============================================================
@api.get("/projects")
async def list_projects(request: Request = None,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.projects.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.get("/projects/{pid}")
async def get_project(pid: str, request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    row = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    return row


@api.post("/projects")
async def create_project(payload: Dict[str, Any], request: Request,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    p = Project(**payload)
    await db.projects.insert_one(p.model_dump())
    await log_activity(u.name, "creó", "proyecto", p.id, f"Nuevo proyecto: {p.nombre}")
    return p.model_dump()


@api.patch("/projects/{pid}")
async def update_project(pid: str, payload: Dict[str, Any], request: Request,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    await db.projects.update_one({"id": pid}, {"$set": payload})
    row = await db.projects.find_one({"id": pid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    await log_activity(u.name, "actualizó", "proyecto", pid, f"Cambios en {row.get('nombre','')}")
    return row


@api.delete("/projects/{pid}")
async def delete_project(pid: str, request: Request,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.projects.delete_one({"id": pid})
    return {"ok": True}


# ============================================================
# TASKS
# ============================================================
@api.get("/tasks")
async def list_tasks(request: Request = None,
                     authorization: Optional[str] = Header(None),
                     session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.tasks.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)


@api.post("/tasks")
async def create_task(payload: Dict[str, Any], request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    t = Task(**payload)
    await db.tasks.insert_one(t.model_dump())
    await log_activity(u.name, "creó", "tarea", t.id, f"Nueva tarea: {t.titulo}")
    return t.model_dump()


@api.patch("/tasks/{tid}")
async def update_task(tid: str, payload: Dict[str, Any], request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    await db.tasks.update_one({"id": tid}, {"$set": payload})
    row = await db.tasks.find_one({"id": tid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    await log_activity(u.name, "actualizó", "tarea", tid, f"Cambios en {row.get('titulo','')}")
    return row


@api.delete("/tasks/{tid}")
async def delete_task(tid: str, request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.tasks.delete_one({"id": tid})
    return {"ok": True}


# ============================================================
# TICKETS
# ============================================================
@api.get("/tickets")
async def list_tickets(request: Request = None,
                       authorization: Optional[str] = Header(None),
                       session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.tickets.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.post("/tickets")
async def create_ticket(payload: Dict[str, Any], request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    t = Ticket(**payload)
    await db.tickets.insert_one(t.model_dump())
    await log_activity(u.name, "creó", "ticket", t.id, f"Nuevo ticket: {t.titulo}")
    return t.model_dump()


@api.patch("/tickets/{tid}")
async def update_ticket(tid: str, payload: Dict[str, Any], request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    await db.tickets.update_one({"id": tid}, {"$set": payload})
    row = await db.tickets.find_one({"id": tid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    await log_activity(u.name, "actualizó", "ticket", tid, f"Cambios en {row.get('titulo','')}")
    return row


@api.delete("/tickets/{tid}")
async def delete_ticket(tid: str, request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.tickets.delete_one({"id": tid})
    return {"ok": True}


# ============================================================
# KB
# ============================================================
@api.get("/kb")
async def list_kb(request: Request = None,
                  authorization: Optional[str] = Header(None),
                  session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.kb.find({}, {"_id": 0}).sort("updated_at", -1).to_list(1000)


@api.post("/kb")
async def create_kb(payload: Dict[str, Any], request: Request,
                    authorization: Optional[str] = Header(None),
                    session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    a = KBArticle(**payload, autor=u.name)
    await db.kb.insert_one(a.model_dump())
    await log_activity(u.name, "creó", "kb", a.id, f"Artículo KB: {a.titulo}")
    return a.model_dump()


@api.patch("/kb/{kid}")
async def update_kb(kid: str, payload: Dict[str, Any], request: Request,
                    authorization: Optional[str] = Header(None),
                    session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    payload["version"] = (await db.kb.find_one({"id": kid}, {"version": 1, "_id": 0}) or {}).get("version", 1) + 1
    await db.kb.update_one({"id": kid}, {"$set": payload})
    row = await db.kb.find_one({"id": kid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    await log_activity(u.name, "actualizó", "kb", kid, f"Cambios en {row.get('titulo','')}")
    return row


@api.delete("/kb/{kid}")
async def delete_kb(kid: str, request: Request,
                    authorization: Optional[str] = Header(None),
                    session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.kb.delete_one({"id": kid})
    return {"ok": True}


# ============================================================
# TEAM
# ============================================================
@api.get("/team")
async def list_team(request: Request = None,
                    authorization: Optional[str] = Header(None),
                    session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.team.find({}, {"_id": 0}).sort("nombre", 1).to_list(500)


@api.post("/team")
async def create_team_member(payload: Dict[str, Any], request: Request,
                             authorization: Optional[str] = Header(None),
                             session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    t = TeamMember(**payload)
    await db.team.insert_one(t.model_dump())
    return t.model_dump()


@api.patch("/team/{tid}")
async def update_team(tid: str, payload: Dict[str, Any], request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.team.update_one({"id": tid}, {"$set": payload})
    row = await db.team.find_one({"id": tid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    return row


@api.delete("/team/{tid}")
async def delete_team(tid: str, request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.team.delete_one({"id": tid})
    return {"ok": True}


# ============================================================
# PROCESS DISCOVERY (AI)
# ============================================================
@api.get("/processes")
async def list_processes(request: Request = None,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    return await db.processes.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)


@api.get("/processes/{pid}")
async def get_process(pid: str, request: Request,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    row = await db.processes.find_one({"id": pid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    return row


@api.post("/processes")
async def create_process(payload: Dict[str, Any], request: Request,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    p = ProcessSession(**payload)
    # Initial AI message
    try:
        opener = await llm_service.interview_turn(
            p.id, [],
            f"Inicia la entrevista para documentar el proceso '{p.nombre_proceso}' del área '{p.area or 'no especificada'}' del cliente '{p.cliente_nombre or 'no especificado'}'. Saluda brevemente y empieza con la primera pregunta."
        )
        p.messages.append({"role": "assistant", "content": opener, "ts": utcnow_iso()})
    except Exception as e:
        logger.error(f"AI opener failed: {e}")
        p.messages.append({"role": "assistant", "content": "Bienvenido. Cuéntame, ¿cuál es el objetivo principal de este proceso y quién es el responsable?", "ts": utcnow_iso()})
    await db.processes.insert_one(p.model_dump())
    await log_activity(u.name, "inició", "proceso", p.id, f"Levantamiento: {p.nombre_proceso}")
    return p.model_dump()


@api.post("/processes/{pid}/message")
async def process_message(pid: str, payload: Dict[str, Any], request: Request,
                          authorization: Optional[str] = Header(None),
                          session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    proc = await db.processes.find_one({"id": pid}, {"_id": 0})
    if not proc: raise HTTPException(404, "Not found")
    user_text = payload.get("text", "")
    messages = proc.get("messages", [])
    messages.append({"role": "user", "content": user_text, "ts": utcnow_iso()})
    history_for_ai = [{"role": m["role"], "content": m["content"]} for m in messages]
    try:
        ai_resp = await llm_service.interview_turn(pid, history_for_ai[:-1], user_text)
    except Exception as e:
        logger.error(f"AI turn failed: {e}")
        ai_resp = "Disculpa, tuve un inconveniente técnico. ¿Puedes repetir o ampliar la última información?"
    interview_done = "[ENTREVISTA_COMPLETA]" in ai_resp
    ai_resp_clean = ai_resp.replace("[ENTREVISTA_COMPLETA]", "").strip()
    messages.append({"role": "assistant", "content": ai_resp_clean, "ts": utcnow_iso()})
    update = {"messages": messages, "updated_at": utcnow_iso()}
    if interview_done:
        update["estado"] = "lista_para_generar"
    await db.processes.update_one({"id": pid}, {"$set": update})
    return {"message": ai_resp_clean, "interview_done": interview_done}


@api.post("/processes/{pid}/generate")
async def process_generate(pid: str, request: Request,
                           authorization: Optional[str] = Header(None),
                           session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    proc = await db.processes.find_one({"id": pid}, {"_id": 0})
    if not proc: raise HTTPException(404, "Not found")
    history = [{"role": m["role"], "content": m["content"]} for m in proc.get("messages", [])]
    summary = await llm_service.generate_documentation(pid, history)
    await db.processes.update_one(
        {"id": pid},
        {"$set": {"summary": summary, "estado": "generado", "updated_at": utcnow_iso()}}
    )
    await log_activity(u.name, "generó", "proceso", pid, f"Documentación generada: {proc.get('nombre_proceso','')}")
    return summary


@api.patch("/processes/{pid}")
async def update_process(pid: str, payload: Dict[str, Any], request: Request,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    payload["updated_at"] = utcnow_iso()
    await db.processes.update_one({"id": pid}, {"$set": payload})
    row = await db.processes.find_one({"id": pid}, {"_id": 0})
    if not row: raise HTTPException(404, "Not found")
    return row


@api.delete("/processes/{pid}")
async def delete_process(pid: str, request: Request,
                         authorization: Optional[str] = Header(None),
                         session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    await db.processes.delete_one({"id": pid})
    return {"ok": True}


# ============================================================
# FILES
# ============================================================
@api.post("/files/upload")
async def upload_file(file: UploadFile = File(...),
                      entity_type: Optional[str] = Query(None),
                      entity_id: Optional[str] = Query(None),
                      request: Request = None,
                      authorization: Optional[str] = Header(None),
                      session_token: Optional[str] = Cookie(None)):
    u = await get_current_user(request, authorization, session_token)
    filename = file.filename or "file.bin"
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    path = f"{APP_NAME}/uploads/{u.user_id}/{uuid.uuid4().hex}.{ext}"
    data = await file.read()
    try:
        result = put_object(path, data, file.content_type or "application/octet-stream")
    except Exception as e:
        logger.error(f"upload failed: {e}")
        raise HTTPException(500, f"Storage error: {e}")
    rec = FileRecord(
        storage_path=result["path"],
        original_filename=filename,
        content_type=file.content_type or "application/octet-stream",
        size=result.get("size", len(data)),
        owner_id=u.user_id,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    await db.files.insert_one(rec.model_dump())
    return rec.model_dump()


@api.get("/files")
async def list_files(entity_type: Optional[str] = None, entity_id: Optional[str] = None,
                     request: Request = None,
                     authorization: Optional[str] = Header(None),
                     session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    q = {"is_deleted": False}
    if entity_type: q["entity_type"] = entity_type
    if entity_id: q["entity_id"] = entity_id
    return await db.files.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.get("/files/{fid}/download")
async def download_file(fid: str,
                        request: Request,
                        authorization: Optional[str] = Header(None),
                        auth: Optional[str] = Query(None),
                        session_token: Optional[str] = Cookie(None)):
    if not authorization and auth:
        authorization = f"Bearer {auth}"
    await get_current_user(request, authorization, session_token)
    rec = await db.files.find_one({"id": fid, "is_deleted": False}, {"_id": 0})
    if not rec: raise HTTPException(404, "Not found")
    data, ctype = get_object(rec["storage_path"])
    return Response(content=data, media_type=rec.get("content_type", ctype))


# ============================================================
# DASHBOARD STATS
# ============================================================
@api.get("/dashboard/stats")
async def dashboard_stats(request: Request,
                          authorization: Optional[str] = Header(None),
                          session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    pros_total = await db.prospects.count_documents({})
    pros_new = await db.prospects.count_documents({"etapa": "prospecto"})
    pros_neg = await db.prospects.count_documents({"etapa": {"$in": ["negociacion", "propuesta"]}})
    clientes = await db.clients.count_documents({"estado": "activo"})
    projects_active = await db.projects.count_documents({"estado": {"$nin": ["cerrado"]}})
    tasks_pending = await db.tasks.count_documents({"estado": {"$in": ["pendiente", "en_proceso"]}})
    tickets_open = await db.tickets.count_documents({"estado": {"$nin": ["cerrado"]}})

    # Ventas estimadas (sum of probabilidad * valor_estimado/100 for non-closed)
    ventas_cursor = db.prospects.find({"etapa": {"$nin": ["ganado", "perdido"]}}, {"_id": 0, "valor_estimado": 1, "probabilidad": 1})
    ventas = 0.0
    async for row in ventas_cursor:
        ventas += (row.get("valor_estimado", 0) or 0) * (row.get("probabilidad", 0) or 0) / 100.0

    # Funnel by etapa
    etapas = ["prospecto","contactado","reunion","diagnostico","propuesta","negociacion","ganado","perdido"]
    funnel = []
    for et in etapas:
        funnel.append({"etapa": et, "total": await db.prospects.count_documents({"etapa": et})})

    # Projects by state
    estados = ["levantamiento","diseno","desarrollo","qa","implementacion","capacitacion","cerrado"]
    project_states = []
    for st in estados:
        project_states.append({"estado": st, "total": await db.projects.count_documents({"estado": st})})

    # Clients by rubro
    rubros = {}
    async for c in db.clients.find({}, {"_id": 0, "rubro": 1}):
        r = c.get("rubro") or "Otro"
        rubros[r] = rubros.get(r, 0) + 1
    clients_by_rubro = [{"rubro": k, "total": v} for k, v in rubros.items()]

    # Team productivity (tasks per responsable)
    team_prod = {}
    async for t in db.tasks.find({"estado": "completado"}, {"_id": 0, "responsable": 1}):
        r = t.get("responsable") or "Sin asignar"
        team_prod[r] = team_prod.get(r, 0) + 1
    team_productivity = [{"miembro": k, "completadas": v} for k, v in team_prod.items()]

    return {
        "prospectos_nuevos": pros_new,
        "prospectos_total": pros_total,
        "negociaciones": pros_neg,
        "clientes_activos": clientes,
        "proyectos_activos": projects_active,
        "tareas_pendientes": tasks_pending,
        "tickets_abiertos": tickets_open,
        "ventas_estimadas": round(ventas, 2),
        "funnel": funnel,
        "project_states": project_states,
        "clients_by_rubro": clients_by_rubro,
        "team_productivity": team_productivity,
    }


@api.get("/activities")
async def list_activities(request: Request,
                          authorization: Optional[str] = Header(None),
                          session_token: Optional[str] = Cookie(None),
                          limit: int = 30):
    await get_current_user(request, authorization, session_token)
    return await db.activities.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)


# ============================================================
# GLOBAL SEARCH
# ============================================================
@api.get("/search")
async def global_search(q: str, request: Request,
                        authorization: Optional[str] = Header(None),
                        session_token: Optional[str] = Cookie(None)):
    await get_current_user(request, authorization, session_token)
    if not q or len(q) < 2:
        return {"results": []}
    rx = {"$regex": q, "$options": "i"}
    results = []
    async for r in db.clients.find({"$or": [{"empresa": rx}, {"razon_social": rx}]}, {"_id": 0}).limit(5):
        results.append({"type": "cliente", "id": r["id"], "label": r["empresa"]})
    async for r in db.prospects.find({"$or": [{"empresa": rx}]}, {"_id": 0}).limit(5):
        results.append({"type": "prospecto", "id": r["id"], "label": r["empresa"]})
    async for r in db.projects.find({"nombre": rx}, {"_id": 0}).limit(5):
        results.append({"type": "proyecto", "id": r["id"], "label": r["nombre"]})
    async for r in db.tasks.find({"titulo": rx}, {"_id": 0}).limit(5):
        results.append({"type": "tarea", "id": r["id"], "label": r["titulo"]})
    async for r in db.tickets.find({"titulo": rx}, {"_id": 0}).limit(5):
        results.append({"type": "ticket", "id": r["id"], "label": r["titulo"]})
    async for r in db.kb.find({"titulo": rx}, {"_id": 0}).limit(5):
        results.append({"type": "kb", "id": r["id"], "label": r["titulo"]})
    return {"results": results}


# ============================================================
# SEED (demo data)
# ============================================================
@api.post("/seed")
async def seed(request: Request,
               authorization: Optional[str] = Header(None),
               session_token: Optional[str] = Cookie(None)):
    """One demo client + prospect + project for testing."""
    u = await get_current_user(request, authorization, session_token)
    existing = await db.clients.count_documents({})
    if existing > 0:
        return {"ok": True, "skipped": True, "message": "Seed already exists"}

    cli = Client(
        empresa="Demo Corp SAC",
        razon_social="Demo Corporation Sociedad Anónima Cerrada",
        ruc="20512345678",
        rubro="Retail",
        pagina_web="https://demo-corp.com",
        ciudad="Lima",
        direccion="Av. Demo 123",
        contacto_principal="Ana García",
        cargo="Gerente General",
        telefono="+51 999 888 777",
        correo="ana@demo-corp.com",
        ticket_promedio=8500.0,
        servicios_activos=2,
        contactos=[{"nombre": "Carlos Pérez", "cargo": "CTO", "correo": "carlos@demo-corp.com"}],
    )
    await db.clients.insert_one(cli.model_dump())

    pros = Prospect(
        empresa="Innova Tech SAC",
        rubro="Software",
        ciudad="Arequipa",
        contacto_nombre="Luis Mendoza",
        cargo="Director de Innovación",
        correo="luis@innova-tech.com",
        telefono="+51 977 666 555",
        fuente="LinkedIn",
        valor_estimado=15000,
        probabilidad=60,
        etapa="propuesta",
        responsable=u.name,
    )
    await db.prospects.insert_one(pros.model_dump())

    proj = Project(
        nombre="Implementación CRM para Demo Corp",
        cliente_id=cli.id,
        cliente_nombre=cli.empresa,
        descripcion="Implementación completa de CRM con integración a sistemas legacy.",
        estado="desarrollo",
        prioridad="alta",
        responsable=u.name,
        progreso=45,
    )
    await db.projects.insert_one(proj.model_dump())

    task = Task(
        titulo="Configurar pipelines del CRM",
        descripcion="Definir etapas y automatizaciones",
        cliente_id=cli.id,
        proyecto_id=proj.id,
        responsable=u.name,
        prioridad="alta",
        estado="en_proceso",
    )
    await db.tasks.insert_one(task.model_dump())

    ticket = Ticket(
        titulo="Error al sincronizar contactos",
        descripcion="El cliente reporta que algunos contactos no se sincronizan.",
        cliente_id=cli.id,
        cliente_nombre=cli.empresa,
        categoria="bug",
        prioridad="alta",
        responsable=u.name,
        estado="en_proceso",
    )
    await db.tickets.insert_one(ticket.model_dump())

    kb = KBArticle(
        titulo="SOP: Onboarding de nuevo cliente",
        categoria="sop",
        contenido="## Pasos\n\n1. Reunión de bienvenida\n2. Levantamiento de procesos\n3. Configuración de accesos\n4. Capacitación inicial",
        tags=["onboarding", "sop"],
        autor=u.name,
    )
    await db.kb.insert_one(kb.model_dump())

    tm = TeamMember(
        nombre="Daniela Ríos",
        cargo="Project Manager",
        especialidad="Gestión de proyectos",
        correo="daniela@emay.com",
        telefono="+51 988 777 666",
    )
    await db.team.insert_one(tm.model_dump())

    return {"ok": True, "message": "Seed created"}


# Register router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origin_regex=".*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init deferred: {e}")


@app.on_event("shutdown")
async def shutdown():
    client.close()
