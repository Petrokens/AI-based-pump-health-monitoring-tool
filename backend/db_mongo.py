"""
MongoDB connection and helpers for Pump PdM backend.
Uses MONGODB_URI from environment (e.g. mongodb+srv://user:pass@cluster.mongodb.net/?appName=Pump).
"""
import os
import logging
from typing import Optional, Any, Dict, List
from datetime import datetime

logger = logging.getLogger("pump-api")

_mongo_client = None
_db = None

# Collection names (admin login in separate collection)
COLL_ADMINS = "admins"
COLL_USERS = "users"
COLL_CLIENTS = "clients"
COLL_DEMO_ENTRIES = "demo_entries"
COLL_PUMPS = "pumps"
COLL_PLANS = "plans"

# Fallback plan limits when no plans in DB
PLAN_MAX_PUMPS = {"Free": 2, "Demo (30 days)": 10}
DEFAULT_PLAN_MAX = 2

# Master admin: created on backend startup (separate collection)
MASTER_ADMIN_EMAIL = "ranjith.c96me@gmail.com"
MASTER_ADMIN_PASSWORD = "12345678"


def get_mongo_uri() -> str:
    """Get MongoDB URI from environment. Prefer MONGODB_URI; fallback for local dev."""
    uri = os.environ.get("MONGODB_URI", "").strip()
    if uri:
        return uri
    # Optional: default for local Atlas cluster (user must set in production)
    return ""


def get_db():
    """Return the MongoDB database instance. Connects on first use."""
    global _mongo_client, _db
    if _db is not None:
        return _db
    uri = get_mongo_uri()
    if not uri:
        logger.warning("MONGODB_URI not set; auth and admin APIs will use in-memory fallback")
        return None
    try:
        from pymongo import MongoClient
        from pymongo.errors import ConnectionFailure
        _mongo_client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _mongo_client.admin.command("ping")
        _db = _mongo_client.get_database("pump_pdm")
        logger.info("MongoDB connected: database pump_pdm")
        _ensure_indexes(_db)
        _ensure_admin_user(_db)
        return _db
    except Exception as e:
        logger.warning("MongoDB connection failed: %s", e)
        return None


def _ensure_indexes(db) -> None:
    """Create indexes for auth and admin collections."""
    try:
        db[COLL_ADMINS].create_index("email", unique=True)
        db[COLL_USERS].create_index("email", unique=True)
        db[COLL_CLIENTS].create_index("email")
        db[COLL_CLIENTS].create_index("createdAt")
        db[COLL_DEMO_ENTRIES].create_index("createdAt")
        db[COLL_PUMPS].create_index("clientId")
        db[COLL_PUMPS].create_index([("clientId", 1), ("createdAt", -1)])
        db[COLL_PLANS].create_index("name")
        db[COLL_PLANS].create_index("isActive")
        _ensure_default_plans(db)
    except Exception as e:
        logger.debug("Index creation: %s", e)


def _ensure_admin_user(db) -> None:
    """Ensure master admin exists in admins collection (created when backend runs)."""
    col = db[COLL_ADMINS]
    existing = col.find_one({"email": MASTER_ADMIN_EMAIL})
    if existing:
        return
    col.insert_one({
        "email": MASTER_ADMIN_EMAIL,
        "password": MASTER_ADMIN_PASSWORD,
        "name": "Master Admin",
        "role": "admin",
        "createdAt": datetime.utcnow().isoformat() + "Z",
    })
    logger.info("Created master admin in collection '%s': %s", COLL_ADMINS, MASTER_ADMIN_EMAIL)


def _ensure_default_plans(db) -> None:
    """If no plans exist, insert default plans (Free, Starter, Pro, Enterprise)."""
    if db[COLL_PLANS].count_documents({}) > 0:
        return
    from bson.objectid import ObjectId
    now = datetime.utcnow().isoformat() + "Z"
    defaults = [
        {"_id": ObjectId(), "id": str(ObjectId()), "name": "Free", "description": "Up to 2 pumps", "price": "Free", "pumpsLimit": 2, "billing": "free", "isActive": True, "order": 0, "createdAt": now, "updatedAt": now},
        {"_id": ObjectId(), "id": str(ObjectId()), "name": "Starter", "description": "Up to 10 pumps", "price": "$29", "priceMonthly": 29, "pumpsLimit": 10, "billing": "monthly", "isActive": True, "order": 1, "createdAt": now, "updatedAt": now},
        {"_id": ObjectId(), "id": str(ObjectId()), "name": "Pro", "description": "Up to 50 pumps, priority support", "price": "$99", "priceMonthly": 99, "pumpsLimit": 50, "billing": "monthly", "isActive": True, "order": 2, "createdAt": now, "updatedAt": now},
        {"_id": ObjectId(), "id": str(ObjectId()), "name": "Enterprise", "description": "Unlimited pumps, dedicated support", "price": "Custom", "pumpsLimit": 999, "billing": "custom", "isActive": True, "order": 3, "createdAt": now, "updatedAt": now},
    ]
    db[COLL_PLANS].insert_many(defaults)
    logger.info("Inserted %s default plans into '%s'", len(defaults), COLL_PLANS)


# ---------- Auth ----------

def auth_login(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Validate credentials: check admins collection first, then users (clients). Returns None if invalid."""
    email_clean = (email or "").strip().lower()
    db = get_db()
    if db is None:
        # In-memory fallback: only master admin
        if email_clean == MASTER_ADMIN_EMAIL and password == MASTER_ADMIN_PASSWORD:
            return {"email": MASTER_ADMIN_EMAIL, "name": "Master Admin", "role": "admin"}
        return None
    # 1. Admin login: separate collection
    admin = db[COLL_ADMINS].find_one({"email": email_clean})
    if admin and admin.get("password") == password:
        return {
            "email": admin["email"],
            "name": admin.get("name", "Master Admin"),
            "role": "admin",
        }
    # 2. Client login: users collection
    user = db[COLL_USERS].find_one({"email": email_clean})
    if not user or user.get("password") != password:
        return None
    return {
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user.get("role", "client"),
        "clientId": user.get("clientId"),
    }


def auth_register_demo(
    name: str,
    company_name: str,
    email: str,
    password: str,
    number_of_pumps: Optional[int] = None,
    phone: Optional[str] = None,
) -> Dict[str, Any]:
    """Register a demo user and create client + demo_entry. Returns user payload and client/demo ids."""
    db = get_db()
    email_clean = (email or "").strip().lower()
    if not email_clean or not password:
        return {"ok": False, "error": "Email and password are required"}

    if db is not None:
        from bson.objectid import ObjectId
        oid = ObjectId()
        client_id = str(oid)
        demo_id = str(ObjectId())
        now = datetime.utcnow().isoformat() + "Z"

        # Check duplicate email
        if db[COLL_CLIENTS].find_one({"email": email_clean}):
            return {"ok": False, "error": "Email already registered"}

        client_doc = {
            "_id": oid,
            "id": client_id,
            "name": name or "",
            "companyName": company_name or "",
            "email": email_clean,
            "password": password,
            "numberOfPumps": number_of_pumps,
            "phone": phone or "",
            "plan": "Free",
            "createdAt": now,
        }
        demo_doc = {
            "_id": ObjectId(),
            "id": demo_id,
            "clientId": client_id,
            "name": name or "",
            "companyName": company_name or "",
            "email": email_clean,
            "numberOfPumps": number_of_pumps,
            "phone": phone or "",
            "createdAt": now,
            "status": "pending",
        }
        user_doc = {
            "_id": ObjectId(),
            "email": email_clean,
            "password": password,
            "name": company_name or name,
            "role": "client",
            "clientId": client_id,
            "createdAt": now,
        }

        db[COLL_CLIENTS].insert_one(client_doc)
        db[COLL_DEMO_ENTRIES].insert_one(demo_doc)
        db[COLL_USERS].insert_one(user_doc)

        return {
            "ok": True,
            "user": {"email": email_clean, "name": company_name or name, "role": "client", "clientId": client_id},
            "clientId": client_id,
            "demoId": demo_id,
        }
    # No DB: in-memory style response (frontend will handle state)
    return {
        "ok": True,
        "user": {"email": email_clean, "name": company_name or name, "role": "client", "clientId": f"client-{datetime.utcnow().timestamp()}"},
        "clientId": None,
        "demoId": None,
    }


# ---------- Admin (clients & demo entries) ----------

def admin_get_clients() -> List[Dict[str, Any]]:
    """Return all clients (for admin)."""
    db = get_db()
    if db is None:
        return []
    cursor = db[COLL_CLIENTS].find({}).sort("createdAt", -1)
    return [_sanitize_doc(d) for d in cursor]


def admin_get_client(client_id: str) -> Optional[Dict[str, Any]]:
    """Return one client by id (string id or ObjectId)."""
    db = get_db()
    if db is None:
        return None
    try:
        from bson.objectid import ObjectId
        q = ObjectId(client_id)
    except Exception:
        q = client_id
    doc = db[COLL_CLIENTS].find_one({"$or": [{"_id": q}, {"id": client_id}]})
    return _sanitize_doc(doc) if doc else None


def admin_get_demo_entries() -> List[Dict[str, Any]]:
    """Return all demo entries (for admin)."""
    db = get_db()
    if db is None:
        return []
    cursor = db[COLL_DEMO_ENTRIES].find({}).sort("createdAt", -1)
    return [_sanitize_doc(d) for d in cursor]


def _sanitize_doc(doc: Dict) -> Dict:
    """Convert MongoDB doc to JSON-safe dict; remove _id or map to id; drop password if present."""
    if not doc:
        return {}
    out = {}
    for k, v in doc.items():
        if k == "_id":
            out["id"] = str(v)
        elif k == "password":
            continue
        else:
            out[k] = v
    if "id" not in out and "_id" in doc:
        out["id"] = str(doc["_id"])
    return out


# ---------- Pumps (per client) ----------

def get_plan_max_pumps(plan: Optional[str]) -> int:
    """Return max pumps allowed for a plan. Checks DB first, then fallback."""
    if not plan:
        return DEFAULT_PLAN_MAX
    db = get_db()
    if db is not None:
        doc = db[COLL_PLANS].find_one({"$or": [{"name": plan}, {"id": plan}], "isActive": True})
        if doc and doc.get("pumpsLimit") is not None:
            return int(doc["pumpsLimit"])
    return PLAN_MAX_PUMPS.get(plan, DEFAULT_PLAN_MAX)


def pumps_count_by_client(client_id: str) -> int:
    """Return number of pumps for a client."""
    db = get_db()
    if db is None:
        return 0
    return db[COLL_PUMPS].count_documents({"clientId": client_id})


def pumps_list_by_client(client_id: str) -> List[Dict[str, Any]]:
    """Return all pumps for a client, newest first."""
    db = get_db()
    if db is None:
        return []
    cursor = db[COLL_PUMPS].find({"clientId": client_id}).sort("createdAt", -1)
    return [_sanitize_doc(d) for d in cursor]


def _ensure_client_exists(client_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Return the client by id. If not found, create a minimal client record so pump creation can proceed
    (e.g. user signed up when DB was down or clientId from localStorage was never persisted).
    """
    client = admin_get_client(client_id)
    if client:
        return client
    db = get_db()
    if db is None:
        return None
    from bson.objectid import ObjectId
    now = datetime.utcnow().isoformat() + "Z"
    # Minimal client so lookups by id work; use string id as provided (e.g. client-123 or MongoDB hex)
    doc = {
        "_id": ObjectId(),
        "id": client_id,
        "name": payload.get("name") or payload.get("companyName") or "",
        "companyName": payload.get("companyName") or payload.get("name") or "",
        "email": (payload.get("email") or "").strip().lower() or None,
        "plan": "Free",
        "createdAt": now,
    }
    db[COLL_CLIENTS].insert_one(doc)
    logger.info("Auto-created minimal client for id=%s (was not found in DB)", client_id)
    return _sanitize_doc(doc)


def pump_create(client_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a pump for the client. Checks plan limit (Free = 2 pumps max).
    If the client does not exist in DB, creates a minimal client so creation can proceed.
    Returns { "ok": True, "pump": {...} } or { "ok": False, "error": "..." }.
    """
    db = get_db()
    if db is None:
        return {"ok": False, "error": "Database not available"}

    client = _ensure_client_exists(client_id, payload)
    if not client:
        return {"ok": False, "error": "Client not found"}

    plan = client.get("plan") or "Free"
    max_pumps = get_plan_max_pumps(plan)
    current_count = pumps_count_by_client(client_id)
    if current_count >= max_pumps:
        return {
            "ok": False,
            "error": f"Plan limit reached. Free plan allows {max_pumps} pump(s) only. Upgrade to add more.",
        }

    pump_id = (payload.get("pump_id") or payload.get("pumpId") or "").strip()
    if not pump_id:
        pump_id = f"P-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

    from bson.objectid import ObjectId
    now = datetime.utcnow().isoformat() + "Z"
    rated = payload.get("rated_flow_m3h") or payload.get("flow") or 150
    if isinstance(rated, (int, float)):
        rated = float(rated)
    doc = {
        "_id": ObjectId(),
        "id": pump_id,
        "clientId": client_id,
        "pump_id": pump_id,
        "categoryId": payload.get("categoryId"),
        "categoryLabel": payload.get("categoryLabel"),
        "pumpType": payload.get("pumpType"),
        "subType": payload.get("subType"),
        "standard": payload.get("standard"),
        "model": payload.get("model") or "Custom",
        "manufacturer": payload.get("manufacturer") or "Unknown",
        "vendor": payload.get("manufacturer") or "Unknown",
        "location": payload.get("location", "Pump House - Unit 1"),
        "rated_flow": rated,
        "createdAt": now,
    }
    # Store extra scalar fields from payload for full details
    for k, v in payload.items():
        if k not in doc and v is not None and isinstance(v, (str, int, float, bool)):
            doc[k] = v

    db[COLL_PUMPS].insert_one(doc)
    return {"ok": True, "pump": _sanitize_doc(doc)}


# ---------- Plans (subscription plans) ----------

def plans_list(active_only: bool = False) -> List[Dict[str, Any]]:
    """List plans. If active_only=True, return only isActive plans (for client-facing)."""
    db = get_db()
    if db is None:
        return []
    q = {"isActive": True} if active_only else {}
    cursor = db[COLL_PLANS].find(q).sort("order", 1).sort("createdAt", 1)
    return [_sanitize_doc(d) for d in cursor]


def plan_by_id(plan_id: str) -> Optional[Dict[str, Any]]:
    """Get one plan by id (string or ObjectId)."""
    db = get_db()
    if db is None:
        return None
    try:
        from bson.objectid import ObjectId
        q = ObjectId(plan_id)
    except Exception:
        q = plan_id
    doc = db[COLL_PLANS].find_one({"$or": [{"_id": q}, {"id": plan_id}]})
    return _sanitize_doc(doc) if doc else None


def plan_create(payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a plan. Returns { ok: True, plan: {...} } or { ok: False, error: str }."""
    db = get_db()
    if db is None:
        return {"ok": False, "error": "Database not available"}
    name = (payload.get("name") or "").strip()
    if not name:
        return {"ok": False, "error": "Plan name is required"}
    if db[COLL_PLANS].find_one({"name": name}):
        return {"ok": False, "error": f"Plan named '{name}' already exists"}
    from bson.objectid import ObjectId
    oid = ObjectId()
    now = datetime.utcnow().isoformat() + "Z"
    pumps_limit = payload.get("pumpsLimit")
    if pumps_limit is not None:
        pumps_limit = int(pumps_limit)
    else:
        pumps_limit = DEFAULT_PLAN_MAX
    doc = {
        "_id": oid,
        "id": str(oid),
        "name": name,
        "description": (payload.get("description") or "").strip(),
        "price": payload.get("price"),  # can be number or string e.g. "Free", "Custom"
        "priceMonthly": payload.get("priceMonthly"),
        "priceYearly": payload.get("priceYearly"),
        "pumpsLimit": pumps_limit,
        "billing": (payload.get("billing") or "monthly").strip() or "monthly",
        "isActive": bool(payload.get("isActive", True)),
        "order": int(payload.get("order", 0)) if payload.get("order") is not None else 0,
        "createdAt": now,
        "updatedAt": now,
    }
    db[COLL_PLANS].insert_one(doc)
    return {"ok": True, "plan": _sanitize_doc(doc)}


def plan_update(plan_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Update a plan. Returns { ok: True, plan: {...} } or { ok: False, error: str }."""
    db = get_db()
    if db is None:
        return {"ok": False, "error": "Database not available"}
    plan = plan_by_id(plan_id)
    if not plan:
        return {"ok": False, "error": "Plan not found"}
    from bson.objectid import ObjectId
    now = datetime.utcnow().isoformat() + "Z"
    updates = {"updatedAt": now}
    for k in ("name", "description", "price", "priceMonthly", "priceYearly", "pumpsLimit", "billing", "isActive", "order"):
        if k in payload:
            if k == "pumpsLimit" and payload[k] is not None:
                updates[k] = int(payload[k])
            elif k == "isActive":
                updates[k] = bool(payload[k])
            elif k == "order":
                updates[k] = int(payload[k]) if payload[k] is not None else 0
            else:
                updates[k] = payload[k]
    try:
        q = ObjectId(plan_id)
    except Exception:
        q = plan_id
    db[COLL_PLANS].update_one(
        {"$or": [{"_id": q}, {"id": plan_id}]},
        {"$set": updates}
    )
    return {"ok": True, "plan": plan_by_id(plan_id) or plan}


def client_update_plan(client_id: str, plan_name: str) -> Dict[str, Any]:
    """Set a client's plan by name. Returns { ok: True } or { ok: False, error: str }."""
    db = get_db()
    if db is None:
        return {"ok": False, "error": "Database not available"}
    client = admin_get_client(client_id)
    if not client:
        return {"ok": False, "error": "Client not found"}
    try:
        from bson.objectid import ObjectId
        q = ObjectId(client_id)
    except Exception:
        q = client_id
    db[COLL_CLIENTS].update_one(
        {"$or": [{"_id": q}, {"id": client_id}]},
        {"$set": {"plan": plan_name, "planUpdatedAt": datetime.utcnow().isoformat() + "Z"}}
    )
    return {"ok": True}
