from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


def new_id():
    return str(uuid.uuid4())


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ─── Auth ───────────────────────────────────────────────
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "provider"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    created_at: str


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


# ─── Provider ───────────────────────────────────────────
class ProviderOnboarding(BaseModel):
    business_name: str
    business_type: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "IE"
    is_mobile: bool = False
    service_radius_km: Optional[int] = None


class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    is_mobile: Optional[bool] = None
    service_radius_km: Optional[int] = None
    max_daily_bookings: Optional[int] = None
    booking_lead_time_hours: Optional[int] = None
    cancellation_window_hours: Optional[int] = None
    auto_accept_bookings: Optional[bool] = None
    is_accepting_bookings: Optional[bool] = None
    business_hours: Optional[dict] = None


# ─── Services ───────────────────────────────────────────
class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    base_price: float
    price_type: str = "fixed"
    duration_minutes: int
    buffer_minutes: int = 15
    max_concurrent: int = 1
    pet_types_accepted: List[str] = ["dog", "cat"]
    vaccination_required: bool = True
    is_active: bool = True


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    base_price: Optional[float] = None
    price_type: Optional[str] = None
    duration_minutes: Optional[int] = None
    buffer_minutes: Optional[int] = None
    pet_types_accepted: Optional[List[str]] = None
    vaccination_required: Optional[bool] = None
    is_active: Optional[bool] = None


# ─── Bookings ───────────────────────────────────────────
class BookingCreate(BaseModel):
    service_id: str
    customer_name: str
    customer_email: str
    pet_name: str
    pet_species: str = "dog"
    pet_breed: Optional[str] = None
    booking_date: str
    start_time: str
    end_time: str
    customer_notes: Optional[str] = None
    add_ons: List[dict] = []
    total_price: Optional[float] = None


class BookingStatusUpdate(BaseModel):
    status: str
    provider_notes: Optional[str] = None
    cancellation_reason: Optional[str] = None


# ─── Booking Requests ──────────────────────────────────
class BookingRequestCreate(BaseModel):
    service_id: str
    customer_name: str
    customer_email: str
    pet_name: str
    pet_species: str = "dog"
    preferred_date: str
    preferred_time_start: Optional[str] = None
    preferred_time_end: Optional[str] = None
    customer_message: Optional[str] = None
    is_urgent: bool = False


class BookingRequestAction(BaseModel):
    action: str  # accept, decline, counter_offer
    response_message: Optional[str] = None
    counter_date: Optional[str] = None
    counter_time: Optional[str] = None
    counter_price: Optional[float] = None
    decline_reason: Optional[str] = None


# ─── Staff ──────────────────────────────────────────────
class StaffCreate(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "staff"
    title: Optional[str] = None
    bio: Optional[str] = None
    specializations: List[str] = []
    work_schedule: Optional[dict] = None
    max_daily_bookings: int = 8
    hourly_rate: Optional[float] = None
    commission_percentage: Optional[float] = None
    hire_date: Optional[str] = None
    is_active: bool = True


class StaffUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    title: Optional[str] = None
    bio: Optional[str] = None
    specializations: Optional[List[str]] = None
    work_schedule: Optional[dict] = None
    max_daily_bookings: Optional[int] = None
    hourly_rate: Optional[float] = None
    is_active: Optional[bool] = None


# ─── Inventory ──────────────────────────────────────────
class InventoryCreate(BaseModel):
    name: str
    category: str = "other"
    description: Optional[str] = None
    sku: Optional[str] = None
    quantity_in_stock: int = 0
    unit: str = "units"
    reorder_point: int = 5
    reorder_quantity: int = 20
    cost_per_unit: Optional[float] = None
    retail_price: Optional[float] = None
    supplier_name: Optional[str] = None
    supplier_contact: Optional[str] = None
    expiry_date: Optional[str] = None
    location_in_store: Optional[str] = None


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    quantity_in_stock: Optional[int] = None
    reorder_point: Optional[int] = None
    cost_per_unit: Optional[float] = None
    retail_price: Optional[float] = None
    supplier_name: Optional[str] = None
    is_active: Optional[bool] = None


class StockAdjustment(BaseModel):
    quantity_change: int
    reason: str = "manual"
    notes: Optional[str] = None


# ─── Marketing ──────────────────────────────────────────
class CampaignCreate(BaseModel):
    name: str
    type: str = "discount"
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    promo_code: Optional[str] = None
    target_audience: str = "all"
    applicable_services: List[str] = []
    start_date: str
    end_date: str
    max_redemptions: Optional[int] = None
    min_booking_value: Optional[float] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_value: Optional[float] = None
    is_active: Optional[bool] = None
    end_date: Optional[str] = None


# ─── Messages ───────────────────────────────────────────
class MessageSend(BaseModel):
    customer_email: str
    content: str
    message_type: str = "text"


# ─── Settings ───────────────────────────────────────────
class SettingsUpdate(BaseModel):
    business_name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    business_hours: Optional[dict] = None
    notification_preferences: Optional[dict] = None
    auto_accept_bookings: Optional[bool] = None
    is_accepting_bookings: Optional[bool] = None
    max_daily_bookings: Optional[int] = None
    booking_lead_time_hours: Optional[int] = None
    cancellation_window_hours: Optional[int] = None
    cancellation_policy: Optional[str] = None
