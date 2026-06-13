"""Claude Sonnet 4.5 AI service for process discovery and document generation."""
import os
import json
import re
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_INTERVIEW = """Eres un consultor experto de EMAY Solution especializado en transformación digital, automatización y mejora de procesos. Estás realizando una entrevista a un cliente para documentar uno de sus procesos de negocio.

Tu objetivo es entender el proceso a fondo. Debes hacer preguntas claras, una a la vez (máximo 2 relacionadas si son muy cortas), en español, con tono profesional pero cercano.

Necesitas cubrir progresivamente estas dimensiones:
1. **Área y responsable** del proceso
2. **Objetivo** del proceso
3. **Actividades** paso a paso (entradas, qué se hace, salidas, proveedores, clientes internos/externos)
4. **Herramientas y sistemas** que se utilizan
5. **Tiempo promedio** y **frecuencia** de ejecución
6. **KPIs** y métricas de éxito
7. **Problemas actuales** y cuellos de botella
8. **Riesgos** y dependencias

Reglas:
- Empieza siempre con una pregunta de apertura corta y amable.
- Pregunta de forma incremental, no satures con muchas preguntas a la vez.
- Reconoce las respuestas brevemente antes de pasar a la siguiente.
- Cuando consideres que tienes información suficiente en TODAS las dimensiones, responde con el texto exacto: `[ENTREVISTA_COMPLETA]` en una línea aparte al final, así el sistema sabrá que puede generar la documentación.
- No inventes datos. Si algo no fue mencionado, pregúntalo.
- Sé conciso. Cada mensaje tuyo máximo 3-4 líneas."""


SYSTEM_PROMPT_GENERATE = """Eres un analista de procesos senior de EMAY Solution. Recibirás la transcripción de una entrevista sobre un proceso de negocio. Debes generar la documentación estructurada en formato JSON EXACTO siguiente (sin texto adicional, sin markdown, solo el JSON crudo):

{
  "sipoc": {
    "suppliers": ["..."],
    "inputs": ["..."],
    "process": ["paso 1", "paso 2", "..."],
    "outputs": ["..."],
    "customers": ["..."]
  },
  "bpmn": {
    "nodes": [
      {"id": "start", "type": "start", "label": "Inicio"},
      {"id": "n1", "type": "task", "label": "Actividad 1"},
      {"id": "n2", "type": "decision", "label": "¿Condición?"},
      {"id": "end", "type": "end", "label": "Fin"}
    ],
    "edges": [
      {"from": "start", "to": "n1"},
      {"from": "n1", "to": "n2"},
      {"from": "n2", "to": "end", "label": "Sí"}
    ]
  },
  "as_is": "Texto descriptivo en markdown del proceso actual (situación AS-IS), problemas detectados, métricas observadas. 4-8 párrafos.",
  "to_be": "Texto descriptivo en markdown de la propuesta TO-BE: cómo debería ser el proceso optimizado, qué cambia, qué mejora. 4-8 párrafos.",
  "automation_opportunities": [
    {"titulo": "...", "descripcion": "...", "impacto": "alto|medio|bajo", "esfuerzo": "alto|medio|bajo", "herramientas_sugeridas": ["..."]}
  ]
}

Responde SÓLO con el JSON. Sin ```json ni explicaciones."""


def _get_chat(session_id: str, system_message: str) -> LlmChat:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY not set")
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")
    return chat


async def interview_turn(session_id: str, history: list, user_text: str) -> str:
    """Run one interview turn. history is a list of {role, content}."""
    chat = _get_chat(session_id, SYSTEM_PROMPT_INTERVIEW)
    # Replay history into the chat object
    # The LlmChat library manages history internally via send_message,
    # but since each request is stateless on our side we need to replay it.
    # Strategy: include the history inside the user message as context.
    if history:
        history_text = "\n".join(
            [f"{'Usuario' if m['role'] == 'user' else 'Consultor'}: {m['content']}" for m in history]
        )
        prompt = f"--- Historial de la conversación previa ---\n{history_text}\n\n--- Nuevo mensaje del usuario ---\n{user_text}"
    else:
        prompt = user_text
    msg = UserMessage(text=prompt)
    response = await chat.send_message(msg)
    return response


async def generate_documentation(session_id: str, history: list) -> dict:
    """Generate SIPOC, BPMN, AS-IS, TO-BE from interview transcript."""
    chat = _get_chat(session_id + "_gen", SYSTEM_PROMPT_GENERATE)
    transcript = "\n".join(
        [f"{'Usuario' if m['role'] == 'user' else 'Consultor'}: {m['content']}" for m in history]
    )
    msg = UserMessage(text=f"Transcripción de la entrevista:\n\n{transcript}\n\nGenera el JSON estructurado.")
    response = await chat.send_message(msg)
    # Try to parse JSON
    text = response.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception as e:
        logger.error(f"Could not parse AI JSON: {e}\nResponse was:\n{text[:500]}")
        # Try to find JSON-shaped block
        m = re.search(r"\{[\s\S]*\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
        return {
            "sipoc": {"suppliers": [], "inputs": [], "process": [], "outputs": [], "customers": []},
            "bpmn": {"nodes": [], "edges": []},
            "as_is": text,
            "to_be": "",
            "automation_opportunities": [],
        }
