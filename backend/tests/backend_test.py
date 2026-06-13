"""EMAY HUB - Backend regression tests (pytest)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://emay-control.preview.emergentagent.com").rstrip("/")
TOKEN = "test_session_001"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}


# ---------- AUTH ----------
class TestAuth:
    def test_me_unauth(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_bearer(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == "admin@emay.com"
        assert data["user_id"] == "test-user-001"


# ---------- SEED ----------
class TestSeed:
    def test_seed_idempotent(self):
        r = requests.post(f"{BASE_URL}/api/seed", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert data.get("ok") is True
        # Second call should skip
        r2 = requests.post(f"{BASE_URL}/api/seed", headers=HEADERS)
        assert r2.status_code == 200


# ---------- DASHBOARD ----------
class TestDashboard:
    def test_stats_structure(self):
        r = requests.get(f"{BASE_URL}/api/dashboard/stats", headers=HEADERS)
        assert r.status_code == 200
        d = r.json()
        for k in ["prospectos_nuevos", "negociaciones", "clientes_activos",
                  "proyectos_activos", "tareas_pendientes", "tickets_abiertos",
                  "ventas_estimadas"]:
            assert k in d, f"missing {k}"
        for arr in ["funnel", "project_states", "clients_by_rubro", "team_productivity"]:
            assert isinstance(d.get(arr), list), f"{arr} not list"

    def test_activities(self):
        r = requests.get(f"{BASE_URL}/api/activities", headers=HEADERS)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------- CRUD helper ----------
def _crud_cycle(resource, create_payload, patch_payload, patch_check_key):
    r = requests.post(f"{BASE_URL}/api/{resource}", json=create_payload, headers=HEADERS)
    assert r.status_code == 200, r.text
    obj = r.json()
    assert "id" in obj
    oid = obj["id"]
    # List
    rl = requests.get(f"{BASE_URL}/api/{resource}", headers=HEADERS)
    assert rl.status_code == 200
    assert any(x["id"] == oid for x in rl.json())
    # Patch
    rp = requests.patch(f"{BASE_URL}/api/{resource}/{oid}", json=patch_payload, headers=HEADERS)
    assert rp.status_code == 200, rp.text
    assert rp.json().get(patch_check_key) == patch_payload[patch_check_key]
    # Delete
    rd = requests.delete(f"{BASE_URL}/api/{resource}/{oid}", headers=HEADERS)
    assert rd.status_code == 200
    return oid


class TestCRUD:
    def test_prospects_crud(self):
        _crud_cycle("prospects",
                    {"empresa": "TEST_ProsCo", "rubro": "Tech", "etapa": "prospecto"},
                    {"etapa": "negociacion"}, "etapa")

    def test_clients_crud(self):
        _crud_cycle("clients",
                    {"empresa": "TEST_CliCo", "ruc": "20111111111", "rubro": "Retail"},
                    {"ciudad": "Lima"}, "ciudad")

    def test_projects_crud(self):
        _crud_cycle("projects",
                    {"nombre": "TEST_Proj", "estado": "levantamiento"},
                    {"estado": "desarrollo"}, "estado")

    def test_tasks_crud(self):
        _crud_cycle("tasks",
                    {"titulo": "TEST_Task", "estado": "pendiente"},
                    {"estado": "en_proceso"}, "estado")

    def test_tickets_crud(self):
        _crud_cycle("tickets",
                    {"titulo": "TEST_Ticket", "estado": "abierto"},
                    {"estado": "en_proceso"}, "estado")

    def test_kb_crud(self):
        _crud_cycle("kb",
                    {"titulo": "TEST_KB", "categoria": "sop", "contenido": "x"},
                    {"contenido": "updated"}, "contenido")

    def test_team_crud(self):
        _crud_cycle("team",
                    {"nombre": "TEST_Member", "cargo": "Dev"},
                    {"cargo": "Lead"}, "cargo")


# ---------- Kanban drag (PATCH etapa) ----------
class TestKanban:
    def test_prospect_etapa_change(self):
        r = requests.post(f"{BASE_URL}/api/prospects",
                          json={"empresa": "TEST_Kan", "etapa": "prospecto"}, headers=HEADERS)
        pid = r.json()["id"]
        rp = requests.patch(f"{BASE_URL}/api/prospects/{pid}",
                            json={"etapa": "negociacion"}, headers=HEADERS)
        assert rp.status_code == 200
        assert rp.json()["etapa"] == "negociacion"
        requests.delete(f"{BASE_URL}/api/prospects/{pid}", headers=HEADERS)


# ---------- Interactions ----------
class TestInteractions:
    def test_create_and_filter(self):
        rp = requests.post(f"{BASE_URL}/api/prospects",
                           json={"empresa": "TEST_IntPro"}, headers=HEADERS)
        prospect_id = rp.json()["id"]
        ri = requests.post(f"{BASE_URL}/api/interactions",
                           json={"prospect_id": prospect_id, "tipo": "llamada",
                                 "titulo": "TEST_Call", "notas": "test"},
                           headers=HEADERS)
        assert ri.status_code == 200
        rl = requests.get(f"{BASE_URL}/api/interactions?prospect_id={prospect_id}", headers=HEADERS)
        assert rl.status_code == 200
        assert len(rl.json()) >= 1
        assert rl.json()[0]["prospect_id"] == prospect_id
        requests.delete(f"{BASE_URL}/api/prospects/{prospect_id}", headers=HEADERS)


# ---------- Search ----------
class TestSearch:
    def test_search_demo(self):
        # Ensure some data exists by relying on seed
        r = requests.get(f"{BASE_URL}/api/search?q=Demo", headers=HEADERS)
        assert r.status_code == 200
        data = r.json()
        assert "results" in data
        assert isinstance(data["results"], list)


# ---------- AI Processes (Claude) ----------
class TestProcesses:
    def test_create_process_ai_opener(self):
        payload = {"nombre_proceso": "TEST_AI_Proc", "area": "Operaciones",
                   "cliente_nombre": "Demo"}
        r = requests.post(f"{BASE_URL}/api/processes", json=payload, headers=HEADERS, timeout=90)
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["id"]
        assert len(p["messages"]) >= 1
        assert p["messages"][0]["role"] == "assistant"
        assert len(p["messages"][0]["content"]) > 10
        # Send a follow-up message
        rm = requests.post(f"{BASE_URL}/api/processes/{p['id']}/message",
                           json={"text": "El objetivo es mejorar la atención al cliente."},
                           headers=HEADERS, timeout=90)
        assert rm.status_code == 200, rm.text
        assert "message" in rm.json()
        assert len(rm.json()["message"]) > 5
        # cleanup
        requests.delete(f"{BASE_URL}/api/processes/{p['id']}", headers=HEADERS)
