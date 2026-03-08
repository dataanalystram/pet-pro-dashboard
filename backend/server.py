from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

from models import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ProviderOnboarding, ProviderProfileUpdate,
    ServiceCreate, ServiceUpdate,
    BookingCreate, BookingStatusUpdate,
    BookingRequestCreate, BookingRequestAction,
    StaffCreate, StaffUpdate,
    InventoryCreate, InventoryUpdate, StockAdjustment,
    CampaignCreate, CampaignUpdate,
    MessageSend, SettingsUpdate,
    new_id, now_iso,
)
import random
from auth_utils import (
    hash_password, verify_password, create_token,
    get_current_user,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# AUTH ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = new_id()
    now = now_iso()
    user_doc = {
        "id": user_id,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "full_name": data.full_name,
        "role": data.role,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id, data.email, data.role)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email,
            "full_name": data.full_name,
            "role": data.role,
            "avatar_url": None,
            "created_at": now,
        }
    }


@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user["id"], user["email"], user["role"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"],
            "product_type": user.get("product_type"),
            "avatar_url": user.get("avatar_url"),
            "created_at": user["created_at"],
        }
    }


@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ═══════════════════════════════════════════════════════════
# PROVIDER ROUTES
# ═══════════════════════════════════════════════════════════

FEATURE_DEFAULTS = {
    "grooming": {"enable_medical": False, "enable_inventory": True, "enable_staff": True, "enable_marketing": True, "enable_routes": False, "enable_capacity": False},
    "veterinary": {"enable_medical": True, "enable_inventory": True, "enable_staff": True, "enable_marketing": True, "enable_routes": False, "enable_capacity": False},
    "walking": {"enable_medical": False, "enable_inventory": False, "enable_staff": False, "enable_marketing": True, "enable_routes": True, "enable_capacity": False},
    "boarding": {"enable_medical": False, "enable_inventory": True, "enable_staff": True, "enable_marketing": True, "enable_routes": False, "enable_capacity": True},
    "sitting": {"enable_medical": False, "enable_inventory": False, "enable_staff": False, "enable_marketing": True, "enable_routes": False, "enable_capacity": False},
    "training": {"enable_medical": False, "enable_inventory": False, "enable_staff": True, "enable_marketing": True, "enable_routes": False, "enable_capacity": False},
    "daycare": {"enable_medical": False, "enable_inventory": True, "enable_staff": True, "enable_marketing": True, "enable_routes": False, "enable_capacity": True},
}


@api_router.post("/provider/onboarding")
async def onboard_provider(data: ProviderOnboarding, current_user: dict = Depends(get_current_user)):
    existing = await db.service_providers.find_one({"user_id": current_user["sub"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Provider profile already exists")

    provider_id = new_id()
    now = now_iso()
    features = FEATURE_DEFAULTS.get(data.business_type, FEATURE_DEFAULTS["grooming"])

    provider_doc = {
        "id": provider_id,
        "user_id": current_user["sub"],
        "business_name": data.business_name,
        "business_type": data.business_type,
        "tagline": None,
        "description": None,
        "logo_url": None,
        "cover_image_url": None,
        "email": data.email or current_user["email"],
        "phone": data.phone,
        "website": None,
        "address_line1": data.address_line1,
        "address_line2": None,
        "city": data.city,
        "state": data.state,
        "postal_code": data.postal_code,
        "country": data.country,
        "latitude": None,
        "longitude": None,
        "is_mobile": data.is_mobile,
        "service_radius_km": data.service_radius_km,
        "max_daily_bookings": 10,
        "booking_lead_time_hours": 24,
        "cancellation_window_hours": 24,
        "auto_accept_bookings": False,
        "notification_preferences": {"email": True, "push": True, "sms": False},
        "business_hours": {
            "monday": {"start": "09:00", "end": "17:00", "is_open": True},
            "tuesday": {"start": "09:00", "end": "17:00", "is_open": True},
            "wednesday": {"start": "09:00", "end": "17:00", "is_open": True},
            "thursday": {"start": "09:00", "end": "17:00", "is_open": True},
            "friday": {"start": "09:00", "end": "17:00", "is_open": True},
            "saturday": {"start": "10:00", "end": "14:00", "is_open": True},
            "sunday": {"start": "00:00", "end": "00:00", "is_open": False},
        },
        "holidays": [],
        "is_verified": False,
        "is_active": True,
        "is_accepting_bookings": True,
        "profile_completion_percentage": 40,
        "average_rating": 0,
        "total_reviews": 0,
        "provider_features": features,
        "created_at": now,
        "updated_at": now,
    }
    await db.service_providers.insert_one(provider_doc)

    # Update user to mark onboarding complete
    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"has_provider_profile": True, "provider_id": provider_id}}
    )

    # Return without _id
    provider_doc.pop("_id", None)
    return provider_doc


@api_router.get("/provider/profile")
async def get_provider_profile(current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    return provider


@api_router.put("/provider/profile")
async def update_provider_profile(data: ProviderProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()

    result = await db.service_providers.update_one(
        {"user_id": current_user["sub"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Provider not found")

    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0}
    )
    return provider


# ═══════════════════════════════════════════════════════════
# SERVICES ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/services")
async def get_services(current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    services = await db.services.find(
        {"provider_id": provider["id"]}, {"_id": 0}
    ).sort("display_order", 1).to_list(100)
    return services


@api_router.post("/provider/services")
async def create_service(data: ServiceCreate, current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    service_id = new_id()
    now = now_iso()
    count = await db.services.count_documents({"provider_id": provider["id"]})

    service_doc = {
        "id": service_id,
        "provider_id": provider["id"],
        **data.model_dump(),
        "display_order": count,
        "images": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.services.insert_one(service_doc)
    service_doc.pop("_id", None)
    return service_doc


@api_router.put("/provider/services/{service_id}")
async def update_service(service_id: str, data: ServiceUpdate, current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = now_iso()

    result = await db.services.update_one(
        {"id": service_id, "provider_id": provider["id"]},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")

    service = await db.services.find_one({"id": service_id}, {"_id": 0})
    return service


@api_router.delete("/provider/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    result = await db.services.delete_one(
        {"id": service_id, "provider_id": provider["id"]}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted"}


# ═══════════════════════════════════════════════════════════
# BOOKINGS ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/bookings")
async def get_bookings(
    status: str = None,
    date_from: str = None,
    date_to: str = None,
    current_user: dict = Depends(get_current_user)
):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    query = {"provider_id": provider["id"]}
    if status:
        query["status"] = status
    if date_from:
        query.setdefault("booking_date", {})["$gte"] = date_from
    if date_to:
        query.setdefault("booking_date", {})["$lte"] = date_to

    bookings = await db.bookings.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)

    # Enrich with service names
    service_ids = list(set(b.get("service_id") for b in bookings if b.get("service_id")))
    if service_ids:
        services = await db.services.find(
            {"id": {"$in": service_ids}}, {"_id": 0, "id": 1, "name": 1, "category": 1, "duration_minutes": 1}
        ).to_list(100)
        service_map = {s["id"]: s for s in services}
        for b in bookings:
            svc = service_map.get(b.get("service_id"), {})
            b["service_name"] = svc.get("name", "Unknown")
            b["service_category"] = svc.get("category", "other")
            b["service_duration"] = svc.get("duration_minutes", 60)

    return bookings


@api_router.get("/provider/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    booking = await db.bookings.find_one(
        {"id": booking_id, "provider_id": provider["id"]}, {"_id": 0}
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    # Enrich
    service = await db.services.find_one({"id": booking.get("service_id")}, {"_id": 0})
    if service:
        booking["service_name"] = service["name"]
        booking["service_category"] = service.get("category", "other")

    return booking


@api_router.post("/provider/bookings")
async def create_booking(data: BookingCreate, current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Get service for pricing
    service = await db.services.find_one({"id": data.service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")

    booking_id = new_id()
    now = now_iso()
    total = data.total_price if data.total_price else service["base_price"]

    booking_doc = {
        "id": booking_id,
        "provider_id": provider["id"],
        "service_id": data.service_id,
        "customer_id": None,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "pet_name": data.pet_name,
        "pet_species": data.pet_species,
        "pet_breed": data.pet_breed,
        "booking_date": data.booking_date,
        "start_time": data.start_time,
        "end_time": data.end_time,
        "status": "confirmed",
        "location_type": "provider_location",
        "base_price": service["base_price"],
        "add_on_price": 0,
        "discount_amount": 0,
        "tax_amount": 0,
        "total_price": total,
        "currency": "EUR",
        "payment_status": "pending",
        "customer_notes": data.customer_notes,
        "provider_notes": None,
        "internal_notes": None,
        "add_ons": data.add_ons,
        "is_recurring": False,
        "customer_rating": None,
        "customer_review": None,
        "service_photos": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.bookings.insert_one(booking_doc)
    booking_doc.pop("_id", None)
    booking_doc["service_name"] = service["name"]
    return booking_doc


@api_router.put("/provider/bookings/{booking_id}/status")
async def update_booking_status(
    booking_id: str,
    data: BookingStatusUpdate,
    current_user: dict = Depends(get_current_user)
):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    update = {
        "status": data.status,
        "updated_at": now_iso(),
        "status_changed_at": now_iso(),
    }
    if data.provider_notes:
        update["provider_notes"] = data.provider_notes
    if data.status == "cancelled" and data.cancellation_reason:
        update["cancellation_reason"] = data.cancellation_reason
        update["cancelled_at"] = now_iso()
    if data.status == "completed":
        update["completed_at"] = now_iso()

    result = await db.bookings.update_one(
        {"id": booking_id, "provider_id": provider["id"]},
        {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return booking


# ═══════════════════════════════════════════════════════════
# BOOKING REQUESTS ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/booking-requests")
async def get_booking_requests(
    status: str = None,
    current_user: dict = Depends(get_current_user)
):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    query = {"provider_id": provider["id"]}
    if status:
        query["status"] = status

    requests = await db.booking_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)

    # Enrich with service names
    service_ids = list(set(r.get("service_id") for r in requests if r.get("service_id")))
    if service_ids:
        services = await db.services.find(
            {"id": {"$in": service_ids}}, {"_id": 0, "id": 1, "name": 1, "base_price": 1}
        ).to_list(100)
        service_map = {s["id"]: s for s in services}
        for r in requests:
            svc = service_map.get(r.get("service_id"), {})
            r["service_name"] = svc.get("name", "Unknown")
            r["service_price"] = svc.get("base_price", 0)

    return requests


@api_router.post("/provider/booking-requests")
async def create_booking_request(data: BookingRequestCreate, current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    request_id = new_id()
    now = now_iso()
    expires = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()

    req_doc = {
        "id": request_id,
        "provider_id": provider["id"],
        "service_id": data.service_id,
        "customer_id": None,
        "customer_name": data.customer_name,
        "customer_email": data.customer_email,
        "pet_name": data.pet_name,
        "pet_species": data.pet_species,
        "preferred_date": data.preferred_date,
        "preferred_time_start": data.preferred_time_start,
        "preferred_time_end": data.preferred_time_end,
        "status": "pending",
        "customer_message": data.customer_message,
        "provider_response": None,
        "counter_offer": None,
        "is_urgent": data.is_urgent,
        "expires_at": expires,
        "responded_at": None,
        "booking_id": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.booking_requests.insert_one(req_doc)
    req_doc.pop("_id", None)
    return req_doc


@api_router.put("/provider/booking-requests/{request_id}/action")
async def handle_booking_request(
    request_id: str,
    data: BookingRequestAction,
    current_user: dict = Depends(get_current_user)
):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    req = await db.booking_requests.find_one(
        {"id": request_id, "provider_id": provider["id"]}, {"_id": 0}
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    now = now_iso()

    if data.action == "accept":
        # Create a booking from the request
        service = await db.services.find_one({"id": req["service_id"]}, {"_id": 0})
        booking_id = new_id()
        start_time = f"{req['preferred_date']}T{req.get('preferred_time_start', '09:00')}:00"
        duration = service["duration_minutes"] if service else 60

        booking_doc = {
            "id": booking_id,
            "provider_id": provider["id"],
            "service_id": req["service_id"],
            "customer_id": req.get("customer_id"),
            "customer_name": req["customer_name"],
            "customer_email": req["customer_email"],
            "pet_name": req["pet_name"],
            "pet_species": req.get("pet_species", "dog"),
            "pet_breed": None,
            "booking_date": req["preferred_date"],
            "start_time": start_time,
            "end_time": start_time,  # Simplified
            "status": "confirmed",
            "location_type": "provider_location",
            "base_price": service["base_price"] if service else 0,
            "total_price": service["base_price"] if service else 0,
            "currency": "EUR",
            "payment_status": "pending",
            "customer_notes": req.get("customer_message"),
            "provider_notes": data.response_message,
            "add_ons": [],
            "is_recurring": False,
            "created_at": now,
            "updated_at": now,
        }
        await db.bookings.insert_one(booking_doc)

        await db.booking_requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "accepted",
                "provider_response": data.response_message,
                "responded_at": now,
                "booking_id": booking_id,
                "updated_at": now,
            }}
        )
        updated_req = await db.booking_requests.find_one({"id": request_id}, {"_id": 0})
        return updated_req

    elif data.action == "decline":
        await db.booking_requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "declined",
                "provider_response": data.decline_reason or data.response_message,
                "responded_at": now,
                "updated_at": now,
            }}
        )
        updated_req = await db.booking_requests.find_one({"id": request_id}, {"_id": 0})
        return updated_req

    elif data.action == "counter_offer":
        counter = {
            "date": data.counter_date,
            "time": data.counter_time,
            "price": data.counter_price,
            "message": data.response_message,
        }
        await db.booking_requests.update_one(
            {"id": request_id},
            {"$set": {
                "status": "counter_offered",
                "counter_offer": counter,
                "provider_response": data.response_message,
                "responded_at": now,
                "updated_at": now,
            }}
        )
        updated_req = await db.booking_requests.find_one({"id": request_id}, {"_id": 0})
        return updated_req

    raise HTTPException(status_code=400, detail="Invalid action")


# ═══════════════════════════════════════════════════════════
# DASHBOARD ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    pid = provider["id"]
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Today's bookings
    today_bookings = await db.bookings.find(
        {"provider_id": pid, "booking_date": today}, {"_id": 0}
    ).to_list(100)

    today_revenue = sum(
        b.get("total_price", 0) for b in today_bookings
        if b.get("status") in ("completed", "in_progress", "confirmed")
    )
    today_completed = sum(1 for b in today_bookings if b.get("status") == "completed")

    # Pending requests
    pending_count = await db.booking_requests.count_documents(
        {"provider_id": pid, "status": "pending"}
    )

    # Week revenue (last 7 days)
    week_data = []
    for i in range(6, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        day_bookings = await db.bookings.find(
            {"provider_id": pid, "booking_date": d, "status": {"$in": ["completed", "confirmed", "in_progress"]}},
            {"_id": 0, "total_price": 1}
        ).to_list(100)
        rev = sum(b.get("total_price", 0) for b in day_bookings)
        count = len(day_bookings)
        week_data.append({"date": d, "revenue": rev, "bookings": count})

    # All-time stats
    total_bookings = await db.bookings.count_documents({"provider_id": pid})
    total_completed = await db.bookings.count_documents({"provider_id": pid, "status": "completed"})
    total_cancelled = await db.bookings.count_documents({"provider_id": pid, "status": "cancelled"})

    return {
        "today_revenue": today_revenue,
        "today_bookings": len(today_bookings),
        "today_completed": today_completed,
        "pending_requests": pending_count,
        "unread_messages": 0,
        "average_rating": provider.get("average_rating", 0),
        "total_reviews": provider.get("total_reviews", 0),
        "total_bookings": total_bookings,
        "total_completed": total_completed,
        "total_cancelled": total_cancelled,
        "week_revenue": week_data,
        "is_accepting_bookings": provider.get("is_accepting_bookings", True),
        "profile_completion": provider.get("profile_completion_percentage", 0),
    }


@api_router.get("/provider/dashboard/today")
async def get_today_schedule(current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    bookings = await db.bookings.find(
        {"provider_id": provider["id"], "booking_date": today}, {"_id": 0}
    ).sort("start_time", 1).to_list(50)

    # Enrich
    service_ids = list(set(b.get("service_id") for b in bookings if b.get("service_id")))
    if service_ids:
        services = await db.services.find(
            {"id": {"$in": service_ids}}, {"_id": 0, "id": 1, "name": 1, "category": 1, "duration_minutes": 1}
        ).to_list(100)
        smap = {s["id"]: s for s in services}
        for b in bookings:
            svc = smap.get(b.get("service_id"), {})
            b["service_name"] = svc.get("name", "Unknown")
            b["service_category"] = svc.get("category", "other")

    return bookings


# ═══════════════════════════════════════════════════════════
# CUSTOMERS ROUTES (basic)
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/customers")
async def get_customers(current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    # Aggregate unique customers from bookings
    bookings = await db.bookings.find(
        {"provider_id": provider["id"]}, {"_id": 0}
    ).to_list(1000)

    customer_map = {}
    for b in bookings:
        key = b.get("customer_email", b.get("customer_name"))
        if key not in customer_map:
            customer_map[key] = {
                "customer_name": b.get("customer_name", "Unknown"),
                "customer_email": b.get("customer_email", ""),
                "total_bookings": 0,
                "total_spent": 0,
                "last_booking_date": b.get("booking_date"),
                "first_booking_date": b.get("booking_date"),
                "pets": set(),
            }
        c = customer_map[key]
        c["total_bookings"] += 1
        c["total_spent"] += b.get("total_price", 0)
        if b.get("booking_date", "") > (c["last_booking_date"] or ""):
            c["last_booking_date"] = b["booking_date"]
        if b.get("booking_date", "") < (c["first_booking_date"] or "9999"):
            c["first_booking_date"] = b["booking_date"]
        if b.get("pet_name"):
            c["pets"].add(b["pet_name"])

    customers = []
    for c in customer_map.values():
        tier = "new"
        if c["total_bookings"] >= 10:
            tier = "vip"
        elif c["total_bookings"] >= 5:
            tier = "loyal"
        elif c["total_bookings"] >= 2:
            tier = "regular"

        customers.append({
            **c,
            "pets": list(c["pets"]),
            "tier": tier,
        })

    customers.sort(key=lambda x: x["total_spent"], reverse=True)
    return customers


# ═══════════════════════════════════════════════════════════
# STAFF ROUTES
# ═══════════════════════════════════════════════════════════

async def _get_provider_id(current_user):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0, "id": 1}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider["id"]


@api_router.get("/provider/staff")
async def get_staff(current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    staff = await db.provider_staff.find({"provider_id": pid}, {"_id": 0}).to_list(100)
    return staff


@api_router.post("/provider/staff")
async def create_staff(data: StaffCreate, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    now = now_iso()
    doc = {
        "id": new_id(), "provider_id": pid,
        **data.model_dump(),
        "avatar_url": None, "average_rating": 0,
        "total_services_completed": 0,
        "created_at": now, "updated_at": now,
    }
    await db.provider_staff.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/provider/staff/{staff_id}")
async def update_staff(staff_id: str, data: StaffUpdate, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.provider_staff.update_one(
        {"id": staff_id, "provider_id": pid}, {"$set": update}
    )
    doc = await db.provider_staff.find_one({"id": staff_id}, {"_id": 0})
    return doc


@api_router.delete("/provider/staff/{staff_id}")
async def delete_staff(staff_id: str, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    await db.provider_staff.delete_one({"id": staff_id, "provider_id": pid})
    return {"message": "Staff deleted"}


# ═══════════════════════════════════════════════════════════
# INVENTORY ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/inventory")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    items = await db.provider_inventory.find({"provider_id": pid}, {"_id": 0}).to_list(500)
    for item in items:
        item["is_low_stock"] = item.get("quantity_in_stock", 0) <= item.get("reorder_point", 5)
    return items


@api_router.post("/provider/inventory")
async def create_inventory(data: InventoryCreate, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    now = now_iso()
    doc = {
        "id": new_id(), "provider_id": pid,
        **data.model_dump(),
        "is_active": True, "created_at": now, "updated_at": now,
    }
    await db.provider_inventory.insert_one(doc)
    doc.pop("_id", None)
    doc["is_low_stock"] = doc["quantity_in_stock"] <= doc["reorder_point"]
    return doc


@api_router.put("/provider/inventory/{item_id}")
async def update_inventory(item_id: str, data: InventoryUpdate, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.provider_inventory.update_one(
        {"id": item_id, "provider_id": pid}, {"$set": update}
    )
    doc = await db.provider_inventory.find_one({"id": item_id}, {"_id": 0})
    if doc:
        doc["is_low_stock"] = doc.get("quantity_in_stock", 0) <= doc.get("reorder_point", 5)
    return doc


@api_router.put("/provider/inventory/{item_id}/adjust")
async def adjust_stock(item_id: str, data: StockAdjustment, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    await db.provider_inventory.update_one(
        {"id": item_id, "provider_id": pid},
        {"$inc": {"quantity_in_stock": data.quantity_change}, "$set": {"updated_at": now_iso()}}
    )
    doc = await db.provider_inventory.find_one({"id": item_id}, {"_id": 0})
    if doc:
        doc["is_low_stock"] = doc.get("quantity_in_stock", 0) <= doc.get("reorder_point", 5)
    return doc


@api_router.delete("/provider/inventory/{item_id}")
async def delete_inventory(item_id: str, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    await db.provider_inventory.delete_one({"id": item_id, "provider_id": pid})
    return {"message": "Item deleted"}


# ═══════════════════════════════════════════════════════════
# MARKETING ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/marketing")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    campaigns = await db.provider_marketing.find({"provider_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return campaigns


@api_router.post("/provider/marketing")
async def create_campaign(data: CampaignCreate, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    now = now_iso()
    doc = {
        "id": new_id(), "provider_id": pid,
        **data.model_dump(),
        "current_redemptions": 0, "views": 0, "clicks": 0,
        "conversions": 0, "revenue_generated": 0,
        "is_active": True, "created_at": now, "updated_at": now,
    }
    await db.provider_marketing.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/provider/marketing/{campaign_id}")
async def update_campaign(campaign_id: str, data: CampaignUpdate, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.provider_marketing.update_one(
        {"id": campaign_id, "provider_id": pid}, {"$set": update}
    )
    doc = await db.provider_marketing.find_one({"id": campaign_id}, {"_id": 0})
    return doc


@api_router.delete("/provider/marketing/{campaign_id}")
async def delete_campaign(campaign_id: str, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    await db.provider_marketing.delete_one({"id": campaign_id, "provider_id": pid})
    return {"message": "Campaign deleted"}


# ═══════════════════════════════════════════════════════════
# MESSAGES ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/messages")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    messages = await db.provider_messages.find({"provider_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    # Group into conversations
    convos = {}
    for m in messages:
        key = m.get("customer_email", "unknown")
        if key not in convos:
            convos[key] = {
                "customer_email": key,
                "customer_name": m.get("customer_name", "Unknown"),
                "last_message": m.get("content", ""),
                "last_message_at": m.get("created_at"),
                "unread_count": 0,
                "messages": [],
            }
        convos[key]["messages"].append(m)
        if not m.get("is_read") and m.get("sender_type") == "customer":
            convos[key]["unread_count"] += 1
    result = sorted(convos.values(), key=lambda c: c["last_message_at"] or "", reverse=True)
    return result


@api_router.get("/provider/messages/{customer_email}")
async def get_thread(customer_email: str, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    messages = await db.provider_messages.find(
        {"provider_id": pid, "customer_email": customer_email}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    # Mark as read
    await db.provider_messages.update_many(
        {"provider_id": pid, "customer_email": customer_email, "is_read": False, "sender_type": "customer"},
        {"$set": {"is_read": True, "read_at": now_iso()}}
    )
    return messages


@api_router.post("/provider/messages")
async def send_message(data: MessageSend, current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    now = now_iso()
    # Get customer name from bookings
    booking = await db.bookings.find_one(
        {"provider_id": pid, "customer_email": data.customer_email}, {"_id": 0, "customer_name": 1}
    )
    doc = {
        "id": new_id(), "provider_id": pid,
        "customer_email": data.customer_email,
        "customer_name": booking.get("customer_name", "Customer") if booking else "Customer",
        "sender_type": "provider", "sender_id": current_user["sub"],
        "content": data.content, "message_type": data.message_type,
        "is_read": True, "created_at": now,
    }
    await db.provider_messages.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# ANALYTICS ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/analytics")
async def get_analytics(
    period: str = "30d",
    current_user: dict = Depends(get_current_user)
):
    pid = await _get_provider_id(current_user)
    now = datetime.now(timezone.utc)

    days = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}.get(period, 30)
    start = (now - timedelta(days=days)).strftime("%Y-%m-%d")

    bookings = await db.bookings.find(
        {"provider_id": pid, "booking_date": {"$gte": start}}, {"_id": 0}
    ).to_list(5000)

    # Enrich bookings with service names
    svc_ids = list(set(b.get("service_id") for b in bookings if b.get("service_id")))
    svc_map = {}
    if svc_ids:
        svcs = await db.services.find({"id": {"$in": svc_ids}}, {"_id": 0, "id": 1, "name": 1}).to_list(200)
        svc_map = {s["id"]: s["name"] for s in svcs}
    for b in bookings:
        if not b.get("service_name"):
            b["service_name"] = svc_map.get(b.get("service_id"), "Unknown")

    # Revenue over time
    revenue_by_date = {}
    booking_by_date = {}
    service_revenue = {}
    customer_set = set()
    status_counts = {"completed": 0, "cancelled": 0, "no_show": 0, "confirmed": 0, "pending": 0, "in_progress": 0}
    day_of_week = [0] * 7
    hour_counts = {}
    total_revenue = 0

    for b in bookings:
        d = b.get("booking_date", "")
        s = b.get("status", "")
        price = b.get("total_price", 0)

        status_counts[s] = status_counts.get(s, 0) + 1

        if s in ("completed", "confirmed", "in_progress"):
            revenue_by_date[d] = revenue_by_date.get(d, 0) + price
            total_revenue += price

        booking_by_date[d] = booking_by_date.get(d, 0) + 1

        sname = b.get("service_name") or "Unknown"
        service_revenue[sname] = service_revenue.get(sname, 0) + price

        ce = b.get("customer_email")
        if ce:
            customer_set.add(ce)

        try:
            from datetime import date as date_type
            bd = date_type.fromisoformat(d)
            day_of_week[bd.weekday()] += 1
        except Exception:
            pass

        st = b.get("start_time", "")
        if "T" in st:
            try:
                h = int(st.split("T")[1][:2])
                hour_counts[h] = hour_counts.get(h, 0) + 1
            except Exception:
                pass

    # Build daily series
    daily_revenue = []
    daily_bookings = []
    for i in range(days):
        d = (now - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily_revenue.append({"date": d, "revenue": revenue_by_date.get(d, 0)})
        daily_bookings.append({"date": d, "bookings": booking_by_date.get(d, 0)})

    # Top services
    top_services = sorted(service_revenue.items(), key=lambda x: x[1], reverse=True)[:10]

    # Top customers
    customer_data = {}
    for b in bookings:
        ce = b.get("customer_email", "")
        if ce not in customer_data:
            customer_data[ce] = {"name": b.get("customer_name", ""), "email": ce, "revenue": 0, "bookings": 0}
        customer_data[ce]["revenue"] += b.get("total_price", 0)
        customer_data[ce]["bookings"] += 1
    top_customers = sorted(customer_data.values(), key=lambda x: x["revenue"], reverse=True)[:10]

    # Day of week labels
    dow_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_of_week_data = [{"day": dow_labels[i], "bookings": day_of_week[i]} for i in range(7)]

    # Hourly heatmap
    hourly_data = [{"hour": h, "bookings": hour_counts.get(h, 0)} for h in range(8, 20)]

    return {
        "total_revenue": total_revenue,
        "total_bookings": len(bookings),
        "total_customers": len(customer_set),
        "avg_booking_value": total_revenue / max(len(bookings), 1),
        "status_distribution": status_counts,
        "daily_revenue": daily_revenue,
        "daily_bookings": daily_bookings,
        "top_services": [{"name": s[0], "revenue": s[1]} for s in top_services],
        "top_customers": top_customers,
        "day_of_week": day_of_week_data,
        "hourly_distribution": hourly_data,
    }


# ═══════════════════════════════════════════════════════════
# SETTINGS ROUTES
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@api_router.put("/provider/settings")
async def update_settings(data: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.service_providers.update_one(
        {"user_id": current_user["sub"]}, {"$set": update}
    )
    provider = await db.service_providers.find_one(
        {"user_id": current_user["sub"]}, {"_id": 0}
    )
    return provider


# ═══════════════════════════════════════════════════════════
# SEARCH ROUTE
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/search")
async def global_search(q: str = "", current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    if not q or len(q) < 2:
        return {"customers": [], "bookings": [], "services": []}

    ql = q.lower()

    # Search customers in bookings
    bookings = await db.bookings.find({"provider_id": pid}, {"_id": 0}).to_list(2000)
    customer_hits = {}
    booking_hits = []
    for b in bookings:
        if ql in (b.get("customer_name", "").lower()) or ql in (b.get("pet_name", "").lower()):
            ce = b.get("customer_email", "")
            if ce not in customer_hits:
                customer_hits[ce] = {"name": b["customer_name"], "email": ce, "pet": b.get("pet_name", "")}
            booking_hits.append({
                "id": b["id"], "customer_name": b["customer_name"],
                "service_name": b.get("service_name", ""), "booking_date": b.get("booking_date", ""),
                "status": b.get("status", ""),
            })

    services = await db.services.find({"provider_id": pid}, {"_id": 0}).to_list(100)
    service_hits = [s for s in services if ql in s.get("name", "").lower()]

    return {
        "customers": list(customer_hits.values())[:10],
        "bookings": booking_hits[:10],
        "services": service_hits[:10],
    }


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS ROUTE
# ═══════════════════════════════════════════════════════════

@api_router.get("/provider/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    notifs = await db.notifications.find({"provider_id": pid}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifs


@api_router.put("/provider/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    pid = await _get_provider_id(current_user)
    await db.notifications.update_many(
        {"provider_id": pid, "is_read": False},
        {"$set": {"is_read": True, "read_at": now_iso()}}
    )
    return {"message": "All notifications marked as read"}


# ═══════════════════════════════════════════════════════════
# SEED DATA ROUTE (for demo)
# ═══════════════════════════════════════════════════════════

@api_router.post("/seed")
async def seed_demo_data():
    """Create demo data for testing. Idempotent - checks if demo user exists."""
    demo_email = "demo@pawparadise.com"
    existing = await db.users.find_one({"email": demo_email}, {"_id": 0})
    if existing:
        return {"message": "Demo data already exists", "email": demo_email, "password": "demo123"}

    # Create demo user
    user_id = new_id()
    provider_id = new_id()
    now = now_iso()

    await db.users.insert_one({
        "id": user_id,
        "email": demo_email,
        "password_hash": hash_password("demo123"),
        "full_name": "Sarah Mitchell",
        "role": "provider",
        "product_type": "service_provider",
        "avatar_url": None,
        "has_provider_profile": True,
        "provider_id": provider_id,
        "created_at": now,
        "updated_at": now,
    })

    # Create provider profile
    await db.service_providers.insert_one({
        "id": provider_id,
        "user_id": user_id,
        "business_name": "Paws & Claws Grooming",
        "business_type": "grooming",
        "tagline": "Where every pet gets the royal treatment",
        "description": "Professional pet grooming with 10+ years of experience. We specialize in breed-specific cuts, spa treatments, and anxious pet handling.",
        "logo_url": None,
        "email": demo_email,
        "phone": "+353 1 234 5678",
        "address_line1": "42 Grafton Street",
        "city": "Dublin",
        "state": "Dublin",
        "postal_code": "D02 Y728",
        "country": "IE",
        "is_mobile": False,
        "service_radius_km": None,
        "max_daily_bookings": 12,
        "booking_lead_time_hours": 24,
        "cancellation_window_hours": 24,
        "auto_accept_bookings": False,
        "business_hours": {
            "monday": {"start": "09:00", "end": "17:00", "is_open": True},
            "tuesday": {"start": "09:00", "end": "17:00", "is_open": True},
            "wednesday": {"start": "09:00", "end": "17:00", "is_open": True},
            "thursday": {"start": "09:00", "end": "18:00", "is_open": True},
            "friday": {"start": "09:00", "end": "17:00", "is_open": True},
            "saturday": {"start": "10:00", "end": "15:00", "is_open": True},
            "sunday": {"start": "00:00", "end": "00:00", "is_open": False},
        },
        "is_verified": True,
        "is_active": True,
        "is_accepting_bookings": True,
        "profile_completion_percentage": 85,
        "average_rating": 4.8,
        "total_reviews": 47,
        "provider_features": {
            "enable_medical": False, "enable_inventory": True,
            "enable_staff": True, "enable_marketing": True,
            "enable_routes": False, "enable_capacity": False,
        },
        "created_at": now,
        "updated_at": now,
    })

    # Create services
    services_data = [
        {"id": new_id(), "name": "Full Groom", "category": "grooming", "base_price": 55.0, "duration_minutes": 90, "description": "Complete grooming: bath, dry, cut, nails, ears"},
        {"id": new_id(), "name": "Bath & Brush", "category": "grooming", "base_price": 35.0, "duration_minutes": 45, "description": "Thorough bath, blow dry, and brush out"},
        {"id": new_id(), "name": "Puppy First Groom", "category": "grooming", "base_price": 30.0, "duration_minutes": 40, "description": "Gentle introduction to grooming for puppies"},
        {"id": new_id(), "name": "Nail Trim", "category": "grooming", "base_price": 15.0, "duration_minutes": 15, "description": "Quick nail trim and file"},
        {"id": new_id(), "name": "De-shedding Treatment", "category": "grooming", "base_price": 45.0, "duration_minutes": 60, "description": "Specialized de-shedding bath and treatment"},
        {"id": new_id(), "name": "Teeth Brushing", "category": "dental", "base_price": 12.0, "duration_minutes": 10, "description": "Professional teeth cleaning add-on"},
    ]
    for i, s in enumerate(services_data):
        await db.services.insert_one({
            **s,
            "provider_id": provider_id,
            "price_type": "fixed",
            "buffer_minutes": 15,
            "max_concurrent": 1,
            "pet_types_accepted": ["dog", "cat"],
            "vaccination_required": True,
            "is_active": True,
            "display_order": i,
            "images": [],
            "created_at": now,
            "updated_at": now,
        })

    # Create bookings - today and nearby dates
    today = datetime.now(timezone.utc)
    customers = [
        ("Emma O'Brien", "emma@example.com", "Bella", "dog", "Golden Retriever"),
        ("James Murphy", "james@example.com", "Max", "dog", "Labrador"),
        ("Aoife Kelly", "aoife@example.com", "Luna", "cat", "Persian"),
        ("Liam Walsh", "liam@example.com", "Charlie", "dog", "Poodle"),
        ("Ciara Doyle", "ciara@example.com", "Milo", "dog", "Cockapoo"),
        ("Sean Ryan", "sean@example.com", "Daisy", "dog", "Shih Tzu"),
        ("Niamh Byrne", "niamh@example.com", "Oscar", "cat", "Maine Coon"),
        ("Patrick Flynn", "patrick@example.com", "Rosie", "dog", "Cavalier King Charles"),
    ]

    times = [
        ("09:00", "10:30"), ("10:45", "11:30"), ("11:45", "13:15"),
        ("14:00", "15:30"), ("15:45", "16:30"),
    ]

    statuses_today = ["confirmed", "confirmed", "in_progress", "confirmed", "pending"]

    # Today's bookings
    for i, (start, end) in enumerate(times):
        if i >= len(customers):
            break
        cust = customers[i]
        svc = services_data[i % len(services_data)]
        date_str = today.strftime("%Y-%m-%d")
        await db.bookings.insert_one({
            "id": new_id(),
            "provider_id": provider_id,
            "service_id": svc["id"],
            "customer_name": cust[0],
            "customer_email": cust[1],
            "pet_name": cust[2],
            "pet_species": cust[3],
            "pet_breed": cust[4],
            "booking_date": date_str,
            "start_time": f"{date_str}T{start}:00",
            "end_time": f"{date_str}T{end}:00",
            "status": statuses_today[i] if i < len(statuses_today) else "confirmed",
            "base_price": svc["base_price"],
            "total_price": svc["base_price"],
            "currency": "EUR",
            "payment_status": "pending",
            "customer_notes": None,
            "provider_notes": None,
            "add_ons": [],
            "is_recurring": False,
            "created_at": now,
            "updated_at": now,
        })

    # Past bookings (last 14 days)
    for day_offset in range(1, 15):
        d = today - timedelta(days=day_offset)
        date_str = d.strftime("%Y-%m-%d")
        num_bookings = 3 + (day_offset % 3)
        for j in range(min(num_bookings, len(times))):
            cust = customers[(day_offset + j) % len(customers)]
            svc = services_data[(day_offset + j) % len(services_data)]
            start, end = times[j]
            await db.bookings.insert_one({
                "id": new_id(),
                "provider_id": provider_id,
                "service_id": svc["id"],
                "customer_name": cust[0],
                "customer_email": cust[1],
                "pet_name": cust[2],
                "pet_species": cust[3],
                "pet_breed": cust[4],
                "booking_date": date_str,
                "start_time": f"{date_str}T{start}:00",
                "end_time": f"{date_str}T{end}:00",
                "status": "completed",
                "base_price": svc["base_price"],
                "total_price": svc["base_price"],
                "currency": "EUR",
                "payment_status": "paid",
                "customer_notes": None,
                "provider_notes": None,
                "add_ons": [],
                "is_recurring": False,
                "completed_at": f"{date_str}T{end}:00",
                "created_at": (d - timedelta(days=2)).isoformat(),
                "updated_at": d.isoformat(),
            })

    # Future bookings
    for day_offset in range(1, 8):
        d = today + timedelta(days=day_offset)
        date_str = d.strftime("%Y-%m-%d")
        for j in range(min(2 + (day_offset % 2), len(times))):
            cust = customers[(day_offset + j + 3) % len(customers)]
            svc = services_data[(day_offset + j) % len(services_data)]
            start, end = times[j]
            await db.bookings.insert_one({
                "id": new_id(),
                "provider_id": provider_id,
                "service_id": svc["id"],
                "customer_name": cust[0],
                "customer_email": cust[1],
                "pet_name": cust[2],
                "pet_species": cust[3],
                "pet_breed": cust[4],
                "booking_date": date_str,
                "start_time": f"{date_str}T{start}:00",
                "end_time": f"{date_str}T{end}:00",
                "status": "confirmed",
                "base_price": svc["base_price"],
                "total_price": svc["base_price"],
                "currency": "EUR",
                "payment_status": "pending",
                "customer_notes": None,
                "add_ons": [],
                "is_recurring": False,
                "created_at": now,
                "updated_at": now,
            })

    # Booking requests
    request_customers = [
        ("Fiona McCarthy", "fiona@example.com", "Rex", "dog", "German Shepherd"),
        ("Declan O'Sullivan", "declan@example.com", "Whiskers", "cat", "Siamese"),
        ("Grace Kavanagh", "grace@example.com", "Buddy", "dog", "Beagle"),
        ("Conor Brennan", "conor@example.com", "Coco", "dog", "French Bulldog"),
    ]

    for i, cust in enumerate(request_customers):
        req_date = (today + timedelta(days=3 + i)).strftime("%Y-%m-%d")
        svc = services_data[i % len(services_data)]
        await db.booking_requests.insert_one({
            "id": new_id(),
            "provider_id": provider_id,
            "service_id": svc["id"],
            "customer_name": cust[0],
            "customer_email": cust[1],
            "pet_name": cust[2],
            "pet_species": cust[3],
            "preferred_date": req_date,
            "preferred_time_start": ["10:00", "14:00", "11:00", "09:00"][i],
            "preferred_time_end": ["11:30", "15:00", "12:00", "10:00"][i],
            "status": "pending",
            "customer_message": [
                "Hi! Rex needs a full groom before his show next week. He's a bit nervous with clippers.",
                "Whiskers needs a bath. She's indoor only but getting a bit matted.",
                "Buddy is due for his regular groom. Same as last time please!",
                "First time grooming for Coco. She's 6 months old and very energetic.",
            ][i],
            "is_urgent": i == 0,
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=48 - i * 8)).isoformat(),
            "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 4)).isoformat(),
            "updated_at": (datetime.now(timezone.utc) - timedelta(hours=i * 4)).isoformat(),
        })

    # ─── Staff seed data ───
    staff_data = [
        {"full_name": "Emily Clarke", "email": "emily@pawsclaws.ie", "role": "manager", "title": "Senior Groomer", "specializations": ["grooming", "dental"], "hourly_rate": 22.0, "hire_date": "2023-06-15", "average_rating": 4.9, "total_services_completed": 342},
        {"full_name": "Ryan O'Connor", "email": "ryan@pawsclaws.ie", "role": "staff", "title": "Groomer", "specializations": ["grooming"], "hourly_rate": 18.0, "hire_date": "2024-01-10", "average_rating": 4.7, "total_services_completed": 178},
        {"full_name": "Aisling Nolan", "email": "aisling@pawsclaws.ie", "role": "part_time", "title": "Bather", "specializations": ["grooming"], "hourly_rate": 15.0, "hire_date": "2024-08-01", "average_rating": 4.6, "total_services_completed": 85},
    ]
    for s in staff_data:
        await db.provider_staff.insert_one({
            "id": new_id(), "provider_id": provider_id, **s,
            "phone": None, "avatar_url": None, "bio": None,
            "work_schedule": {"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "17:00"}, "friday": {"start": "09:00", "end": "17:00"}},
            "max_daily_bookings": 8, "is_active": True, "created_at": now, "updated_at": now,
        })

    # ─── Inventory seed data ───
    inventory_data = [
        {"name": "Dog Shampoo (500ml)", "category": "grooming_supplies", "quantity_in_stock": 24, "reorder_point": 10, "cost_per_unit": 8.50, "retail_price": 15.00, "supplier_name": "PetPro Supplies"},
        {"name": "Cat Shampoo (500ml)", "category": "grooming_supplies", "quantity_in_stock": 12, "reorder_point": 5, "cost_per_unit": 9.00, "retail_price": 16.00, "supplier_name": "PetPro Supplies"},
        {"name": "Nail Clippers (Large)", "category": "equipment", "quantity_in_stock": 6, "reorder_point": 2, "cost_per_unit": 18.00, "retail_price": None, "supplier_name": "GroomTech"},
        {"name": "Slicker Brush", "category": "equipment", "quantity_in_stock": 8, "reorder_point": 3, "cost_per_unit": 12.00, "retail_price": 22.00, "supplier_name": "GroomTech"},
        {"name": "Ear Cleaning Solution", "category": "grooming_supplies", "quantity_in_stock": 3, "reorder_point": 5, "cost_per_unit": 6.50, "retail_price": 12.00, "supplier_name": "VetCare Dist"},
        {"name": "Tooth Paste (Dog)", "category": "grooming_supplies", "quantity_in_stock": 15, "reorder_point": 8, "cost_per_unit": 4.00, "retail_price": 8.00, "supplier_name": "VetCare Dist"},
        {"name": "Bandana (Small)", "category": "retail", "quantity_in_stock": 30, "reorder_point": 10, "cost_per_unit": 2.50, "retail_price": 6.00, "supplier_name": "Pet Fashion"},
        {"name": "Towels (Pack of 10)", "category": "cleaning", "quantity_in_stock": 4, "reorder_point": 3, "cost_per_unit": 25.00, "retail_price": None, "supplier_name": "CleanPro"},
    ]
    for inv in inventory_data:
        await db.provider_inventory.insert_one({
            "id": new_id(), "provider_id": provider_id, **inv,
            "description": None, "sku": None, "unit": "units", "reorder_quantity": 20,
            "supplier_contact": None, "expiry_date": None, "location_in_store": None,
            "is_active": True, "created_at": now, "updated_at": now,
        })

    # ─── Marketing seed data ───
    campaigns_data = [
        {"name": "New Customer Welcome", "type": "first_time", "description": "20% off first grooming session", "discount_type": "percentage", "discount_value": 20, "promo_code": "WELCOME20", "target_audience": "new_customers", "start_date": (today - timedelta(days=30)).isoformat(), "end_date": (today + timedelta(days=60)).isoformat(), "max_redemptions": 100, "current_redemptions": 23, "views": 450, "clicks": 89, "conversions": 23, "revenue_generated": 1265.00},
        {"name": "Loyalty Reward", "type": "loyalty_reward", "description": "Free nail trim with 5th visit", "discount_type": "free_addon", "discount_value": 15, "promo_code": None, "target_audience": "returning", "start_date": (today - timedelta(days=60)).isoformat(), "end_date": (today + timedelta(days=120)).isoformat(), "max_redemptions": None, "current_redemptions": 12, "views": 230, "clicks": 45, "conversions": 12, "revenue_generated": 780.00},
        {"name": "Spring Special", "type": "seasonal", "description": "15% off de-shedding treatment", "discount_type": "percentage", "discount_value": 15, "promo_code": "SPRING15", "target_audience": "all", "start_date": (today + timedelta(days=10)).isoformat(), "end_date": (today + timedelta(days=45)).isoformat(), "max_redemptions": 50, "current_redemptions": 0, "views": 0, "clicks": 0, "conversions": 0, "revenue_generated": 0},
    ]
    for camp in campaigns_data:
        await db.provider_marketing.insert_one({
            "id": new_id(), "provider_id": provider_id, **camp,
            "applicable_services": [], "min_booking_value": None,
            "is_active": True, "created_at": now, "updated_at": now,
        })

    # ─── Messages seed data ───
    msg_convos = [
        ("Emma O'Brien", "emma@example.com", [
            ("customer", "Hi! Can Bella get the de-shedding treatment too along with her groom?"),
            ("provider", "Of course! I'll add it to her appointment. See you tomorrow!"),
            ("customer", "Perfect, thanks so much!"),
        ]),
        ("James Murphy", "james@example.com", [
            ("customer", "Max was great after his last groom, thank you!"),
            ("provider", "So glad to hear! He was such a good boy. See you in 6 weeks!"),
        ]),
        ("Fiona McCarthy", "fiona@example.com", [
            ("customer", "Rex needs an urgent groom before his show. Is there any availability this week?"),
        ]),
    ]
    for cname, cemail, msgs in msg_convos:
        for i, (sender, content) in enumerate(msgs):
            await db.provider_messages.insert_one({
                "id": new_id(), "provider_id": provider_id,
                "customer_email": cemail, "customer_name": cname,
                "sender_type": sender, "sender_id": user_id if sender == "provider" else "customer",
                "content": content, "message_type": "text",
                "is_read": sender == "provider", "created_at": (datetime.now(timezone.utc) - timedelta(hours=24 - i * 2)).isoformat(),
            })

    # ─── Notifications seed data ───
    notif_data = [
        {"type": "booking_request", "title": "New booking request", "message": "Fiona McCarthy requested a Full Groom for Rex", "is_read": False},
        {"type": "review", "title": "New 5-star review", "message": "Emma O'Brien left a 5-star review for Full Groom", "is_read": False},
        {"type": "low_stock", "title": "Low stock alert", "message": "Ear Cleaning Solution is running low (3 left)", "is_read": False},
        {"type": "booking_confirmed", "title": "Booking confirmed", "message": "Liam Walsh confirmed his appointment for tomorrow", "is_read": True},
        {"type": "payment", "title": "Payment received", "message": "€55.00 received from Aoife Kelly", "is_read": True},
    ]
    for i, n in enumerate(notif_data):
        await db.notifications.insert_one({
            "id": new_id(), "provider_id": provider_id, **n,
            "link": None, "created_at": (datetime.now(timezone.utc) - timedelta(hours=i * 3)).isoformat(),
        })

    return {
        "message": "Demo data seeded successfully",
        "email": demo_email,
        "password": "demo123",
        "provider_id": provider_id,
    }


# ═══════════════════════════════════════════════════════════
# APP SETUP
# ═══════════════════════════════════════════════════════════

# Import and include vet and shelter routers
from vet_routes import router as vet_router
from shelter_routes import router as shelter_router
from shelter_extended_routes import router as shelter_extended_router
from shelter_extended_routes import public_router as shelter_public_router

app.include_router(api_router)
app.include_router(vet_router)
app.include_router(shelter_router)
app.include_router(shelter_extended_router)
app.include_router(shelter_public_router)

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


# ═══════════════════════════════════════════════════════════
# CSV IMPORT (Shared)
# ═══════════════════════════════════════════════════════════

@api_router.post("/import/csv")
async def import_csv(data: dict, current_user: dict = Depends(get_current_user)):
    """Generic CSV import endpoint. Accepts parsed CSV rows and target collection."""
    collection_name = data.get("collection")
    rows = data.get("rows", [])
    product_type = data.get("product_type", "service_provider")

    if not collection_name or not rows:
        raise HTTPException(status_code=400, detail="collection and rows required")

    ALLOWED_COLLECTIONS = {
        "vet_clients", "vet_patients", "vet_inventory",
        "shelter_animals", "shelter_volunteers", "shelter_donations",
        "provider_customers", "provider_inventory",
    }
    if collection_name not in ALLOWED_COLLECTIONS:
        raise HTTPException(status_code=400, detail=f"Collection {collection_name} not allowed")

    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    now = now_iso()
    inserted = 0

    # Get context IDs
    clinic_id = user.get("vet_clinic_id")
    shelter_id = user.get("shelter_id")
    provider_id = user.get("provider_id")

    for row in rows:
        doc = {**row, "id": new_id(), "created_at": now, "updated_at": now}
        if clinic_id and collection_name.startswith("vet_"):
            doc["clinic_id"] = clinic_id
        if shelter_id and collection_name.startswith("shelter_"):
            doc["shelter_id"] = shelter_id
        if provider_id and collection_name.startswith("provider_"):
            doc["provider_id"] = provider_id

        # Set defaults
        if collection_name == "vet_patients":
            doc.setdefault("is_active", True)
            doc.setdefault("is_deceased", False)
            doc.setdefault("allergies", [])
            doc.setdefault("chronic_conditions", [])
            doc.setdefault("behavioral_alerts", [])
        elif collection_name == "shelter_animals":
            doc.setdefault("adoption_status", "available")
            doc.setdefault("outcome_date", None)
            doc.setdefault("is_published", True)
            species_prefix = {"dog": "D", "cat": "C"}.get(doc.get("species", "dog"), "O")
            count = await db.shelter_animals.count_documents({"shelter_id": shelter_id}) + inserted
            doc["animal_id_code"] = f"{species_prefix}-2025-{count + 1:04d}"
        elif collection_name == "vet_clients":
            doc.setdefault("is_active", True)
            doc.setdefault("balance", 0)
            doc.setdefault("total_visits", 0)
            doc.setdefault("total_spent", 0)

        await db[collection_name].insert_one(doc)
        inserted += 1

    return {"message": f"Imported {inserted} records", "count": inserted}
