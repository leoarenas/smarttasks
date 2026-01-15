from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'default-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserCreate(BaseModel):
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class SetPasswordRequest(BaseModel):
    token: str
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: Optional[str] = None
    is_verified: bool = False
    is_admin: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VerificationToken(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    expires_at: str = Field(default_factory=lambda: (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat())

class TaskCreate(BaseModel):
    name: str
    description: str
    frequency: str  # Diaria, Semanal, Mensual, Ocasional
    duration: str
    impact: Optional[int] = None  # 1-5
    risk: Optional[int] = None  # 1-5
    effort: Optional[int] = None  # 1-5
    confidentiality: Optional[str] = None  # Baja, Media, Alta

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    impact: Optional[int] = None
    risk: Optional[int] = None
    effort: Optional[int] = None
    confidentiality: Optional[str] = None
    decision: Optional[str] = None
    decision_justification: Optional[str] = None
    suggested_profile: Optional[str] = None
    suggested_hours: Optional[str] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: str
    frequency: str
    duration: str
    impact: Optional[int] = None
    risk: Optional[int] = None
    effort: Optional[int] = None
    confidentiality: Optional[str] = None
    decision: Optional[str] = None  # C, D, A, E
    decision_justification: Optional[str] = None
    suggested_profile: Optional[str] = None
    suggested_hours: Optional[str] = None
    analyzed_at: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AppConfig(BaseModel):
    id: str = "app_config"
    resend_api_key: Optional[str] = None
    sender_email: Optional[str] = None
    app_name: str = "SmartTasks"
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ConfigUpdate(BaseModel):
    resend_api_key: Optional[str] = None
    sender_email: Optional[str] = None
    app_name: Optional[str] = None

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, is_admin: bool) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "is_admin": is_admin,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    return user

# ===================== EMAIL HELPERS =====================

async def get_app_config() -> dict:
    config = await db.app_config.find_one({"id": "app_config"}, {"_id": 0})
    if not config:
        config = AppConfig().model_dump()
        await db.app_config.insert_one(config)
    return config

async def send_verification_email(email: str, token: str, frontend_url: str) -> dict:
    config = await get_app_config()
    verification_link = f"{frontend_url}/verify-email?token={token}"
    
    if not config.get("resend_api_key") or not config.get("sender_email"):
        logger.info(f"Email no configurado. Link de verificación: {verification_link}")
        return {"status": "testing", "verification_link": verification_link}
    
    try:
        resend.api_key = config["resend_api_key"]
        params = {
            "from": config["sender_email"],
            "to": [email],
            "subject": f"Verifica tu cuenta en {config.get('app_name', 'SmartTasks')}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #E91E8C;">¡Bienvenido a {config.get('app_name', 'SmartTasks')}!</h1>
                <p>Gracias por registrarte. Por favor verifica tu cuenta haciendo clic en el siguiente enlace:</p>
                <a href="{verification_link}" style="display: inline-block; background-color: #E91E8C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Verificar mi cuenta</a>
                <p style="color: #666;">Si no creaste esta cuenta, puedes ignorar este email.</p>
                <p style="color: #666; font-size: 12px;">Este enlace expira en 24 horas.</p>
            </div>
            """
        }
        email_result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "sent", "email_id": email_result.get("id")}
    except Exception as e:
        logger.error(f"Error enviando email: {str(e)}")
        return {"status": "testing", "verification_link": verification_link, "error": str(e)}

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Este email ya está registrado")
    
    # Check if this is the first user (make admin)
    user_count = await db.users.count_documents({})
    is_admin = user_count == 0
    
    user = User(email=user_data.email, is_admin=is_admin)
    await db.users.insert_one(user.model_dump())
    
    # Create verification token
    verification = VerificationToken(user_id=user.id)
    await db.verification_tokens.insert_one(verification.model_dump())
    
    # Get frontend URL from request or use default
    frontend_url = os.environ.get("FRONTEND_URL", "https://smarttasks-15.preview.emergentagent.com")
    email_result = await send_verification_email(user.email, verification.token, frontend_url)
    
    response = {
        "message": "Usuario registrado. Por favor verifica tu email.",
        "user_id": user.id,
        "is_admin": is_admin
    }
    
    if email_result.get("status") == "testing":
        response["verification_link"] = email_result.get("verification_link")
        response["note"] = "Email no configurado. Usa el link de verificación directamente."
    
    return response

@api_router.post("/auth/verify-email")
async def verify_email(request: SetPasswordRequest):
    token_doc = await db.verification_tokens.find_one({"token": request.token}, {"_id": 0})
    if not token_doc:
        raise HTTPException(status_code=400, detail="Token de verificación inválido")
    
    # Check expiration
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token expirado")
    
    # Update user
    password_hash = hash_password(request.password)
    await db.users.update_one(
        {"id": token_doc["user_id"]},
        {"$set": {"password_hash": password_hash, "is_verified": True}}
    )
    
    # Delete used token
    await db.verification_tokens.delete_one({"token": request.token})
    
    # Get user and create JWT
    user = await db.users.find_one({"id": token_doc["user_id"]}, {"_id": 0})
    jwt_token = create_jwt_token(user["id"], user["email"], user.get("is_admin", False))
    
    return {
        "message": "Email verificado exitosamente",
        "token": jwt_token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "is_admin": user.get("is_admin", False)
        }
    }

@api_router.post("/auth/login")
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not user.get("is_verified"):
        raise HTTPException(status_code=401, detail="Por favor verifica tu email primero")
    
    if not user.get("password_hash") or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_jwt_token(user["id"], user["email"], user.get("is_admin", False))
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "is_admin": user.get("is_admin", False)
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "id": user["id"],
        "email": user["email"],
        "is_admin": user.get("is_admin", False)
    }

# ===================== CONFIG ENDPOINTS =====================

@api_router.get("/config")
async def get_config(user: dict = Depends(get_admin_user)):
    config = await get_app_config()
    # Mask API key for security
    if config.get("resend_api_key"):
        config["resend_api_key"] = config["resend_api_key"][:8] + "..." + config["resend_api_key"][-4:]
    return config

@api_router.put("/config")
async def update_config(config_update: ConfigUpdate, user: dict = Depends(get_admin_user)):
    update_data = {k: v for k, v in config_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.app_config.update_one(
        {"id": "app_config"},
        {"$set": update_data},
        upsert=True
    )
    
    return {"message": "Configuración actualizada"}

@api_router.get("/config/status")
async def get_config_status():
    """Public endpoint to check if email is configured"""
    config = await get_app_config()
    return {
        "email_configured": bool(config.get("resend_api_key") and config.get("sender_email")),
        "app_name": config.get("app_name", "SmartTasks")
    }

# ===================== TASK ENDPOINTS =====================

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(task_data: TaskCreate, user: dict = Depends(get_current_user)):
    task = Task(user_id=user["id"], **task_data.model_dump())
    await db.tasks.insert_one(task.model_dump())
    return task

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str, user: dict = Depends(get_current_user)):
    task = await db.tasks.find_one({"id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return task

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_data: TaskUpdate, user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in task_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")
    
    result = await db.tasks.update_one(
        {"id": task_id, "user_id": user["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    return task

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: dict = Depends(get_current_user)):
    result = await db.tasks.delete_one({"id": task_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return {"message": "Tarea eliminada"}

# ===================== AI ANALYSIS ENDPOINT =====================

@api_router.post("/tasks/{task_id}/analyze")
async def analyze_task(task_id: str, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    task = await db.tasks.find_one({"id": task_id, "user_id": user["id"]}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="API key no configurada")
    
    prompt = f"""Analiza esta tarea empresarial y proporciona una recomendación estructurada.

TAREA:
- Nombre: {task['name']}
- Descripción: {task['description']}
- Frecuencia: {task['frequency']}
- Duración estimada: {task['duration']}
- Impacto actual (si proporcionado): {task.get('impact', 'No especificado')}
- Riesgo actual (si proporcionado): {task.get('risk', 'No especificado')}
- Esfuerzo actual (si proporcionado): {task.get('effort', 'No especificado')}
- Confidencialidad actual (si proporcionado): {task.get('confidentiality', 'No especificado')}

REGLAS DE DECISIÓN (aplica en este orden de prioridad):

1. CONSERVAR (C): Cuando Riesgo ≥ 4 O Confidencialidad = Alta
   - Tareas críticas que el dueño debe mantener temporalmente

2. DELEGAR (D): Cuando Esfuerzo ≥ 3 Y Impacto ≥ 3 Y Riesgo ≤ 3
   - Tareas que pueden asignarse a otros

3. AUTOMATIZAR (A): Cuando es tarea recurrente (frecuencia alta) Y proceso repetitivo con reglas claras
   - Tareas que pueden sistematizarse

4. ELIMINAR (E): Cuando Impacto ≤ 2 Y no tiene vínculo claro con objetivos del negocio
   - Tareas que no agregan valor

PERFILES PARA DELEGACIÓN:
- Prospección comercial → Agencia externa (10-20 hrs/sem)
- Pagos y conciliaciones → Administrativo interno (2-4 hrs/sem)
- Marketing y redes sociales → Community Manager o Agencia externa (4-8 hrs/sem)
- Legal y contratos → Estudio jurídico externo (2-4 hrs/sem)
- Contabilidad e impuestos → Estudio contable externo (4-8 hrs/sem)

Responde ÚNICAMENTE en formato JSON con esta estructura exacta:
{{
    "impact": <número 1-5>,
    "risk": <número 1-5>,
    "effort": <número 1-5>,
    "confidentiality": "<Baja|Media|Alta>",
    "decision": "<C|D|A|E>",
    "decision_justification": "<explicación breve en español de por qué esta decisión>",
    "suggested_profile": "<perfil sugerido si es D, null si no>",
    "suggested_hours": "<horas sugeridas si es D, null si no>"
}}"""

    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"task-analysis-{task_id}",
            system_message="Eres un consultor empresarial experto en optimización de tiempo y delegación de tareas para PyMEs. Responde siempre en español y en formato JSON."
        ).with_model("openai", "gpt-4o")
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Parse JSON response
        import json
        # Clean response if needed
        response_text = response.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        analysis = json.loads(response_text.strip())
        
        # Update task with analysis results
        update_data = {
            "impact": analysis.get("impact"),
            "risk": analysis.get("risk"),
            "effort": analysis.get("effort"),
            "confidentiality": analysis.get("confidentiality"),
            "decision": analysis.get("decision"),
            "decision_justification": analysis.get("decision_justification"),
            "suggested_profile": analysis.get("suggested_profile"),
            "suggested_hours": analysis.get("suggested_hours"),
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.tasks.update_one({"id": task_id}, {"$set": update_data})
        
        updated_task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
        return updated_task
        
    except json.JSONDecodeError as e:
        logger.error(f"Error parsing AI response: {e}")
        raise HTTPException(status_code=500, detail="Error procesando respuesta de IA")
    except Exception as e:
        logger.error(f"Error analyzing task: {e}")
        raise HTTPException(status_code=500, detail=f"Error analizando tarea: {str(e)}")

@api_router.post("/tasks/analyze-all")
async def analyze_all_tasks(user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    results = []
    
    for task in tasks:
        try:
            # Reuse the analyze endpoint logic
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            import json
            
            api_key = os.environ.get("EMERGENT_LLM_KEY")
            
            prompt = f"""Analiza esta tarea empresarial y proporciona una recomendación estructurada.

TAREA:
- Nombre: {task['name']}
- Descripción: {task['description']}
- Frecuencia: {task['frequency']}
- Duración estimada: {task['duration']}

REGLAS DE DECISIÓN:
1. CONSERVAR (C): Riesgo ≥ 4 O Confidencialidad = Alta
2. DELEGAR (D): Esfuerzo ≥ 3 Y Impacto ≥ 3 Y Riesgo ≤ 3
3. AUTOMATIZAR (A): Tarea recurrente Y proceso repetitivo
4. ELIMINAR (E): Impacto ≤ 2 Y sin vínculo con objetivos

Responde ÚNICAMENTE en JSON:
{{"impact": <1-5>, "risk": <1-5>, "effort": <1-5>, "confidentiality": "<Baja|Media|Alta>", "decision": "<C|D|A|E>", "decision_justification": "<explicación>", "suggested_profile": "<perfil o null>", "suggested_hours": "<horas o null>"}}"""

            chat = LlmChat(
                api_key=api_key,
                session_id=f"task-analysis-{task['id']}",
                system_message="Eres un consultor empresarial. Responde en español y JSON."
            ).with_model("openai", "gpt-4o")
            
            response = await chat.send_message(UserMessage(text=prompt))
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            analysis = json.loads(response_text.strip())
            
            update_data = {
                "impact": analysis.get("impact"),
                "risk": analysis.get("risk"),
                "effort": analysis.get("effort"),
                "confidentiality": analysis.get("confidentiality"),
                "decision": analysis.get("decision"),
                "decision_justification": analysis.get("decision_justification"),
                "suggested_profile": analysis.get("suggested_profile"),
                "suggested_hours": analysis.get("suggested_hours"),
                "analyzed_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.tasks.update_one({"id": task['id']}, {"$set": update_data})
            results.append({"task_id": task['id'], "status": "success"})
            
        except Exception as e:
            logger.error(f"Error analyzing task {task['id']}: {e}")
            results.append({"task_id": task['id'], "status": "error", "error": str(e)})
    
    return {"results": results, "total": len(tasks), "success": sum(1 for r in results if r["status"] == "success")}

# ===================== REPORT ENDPOINT =====================

@api_router.get("/report")
async def get_report(user: dict = Depends(get_current_user)):
    tasks = await db.tasks.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    
    total = len(tasks)
    analyzed = [t for t in tasks if t.get("decision")]
    
    stats = {
        "total": total,
        "analyzed": len(analyzed),
        "conservar": len([t for t in analyzed if t.get("decision") == "C"]),
        "delegar": len([t for t in analyzed if t.get("decision") == "D"]),
        "automatizar": len([t for t in analyzed if t.get("decision") == "A"]),
        "eliminar": len([t for t in analyzed if t.get("decision") == "E"])
    }
    
    return {
        "stats": stats,
        "tasks": tasks
    }

# ===================== ROOT ENDPOINT =====================

@api_router.get("/")
async def root():
    return {"message": "SmartTasks API", "version": "1.0.0"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
