from pydantic import BaseModel, Field
from typing import List, Optional
from models import new_id, now_iso


# ─── Vet Clinic ─────────────────────────────────────────
class VetClinicOnboarding(BaseModel):
    name: str
    clinic_type: str = "general"
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "IE"


class VetClinicUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    emergency_phone: Optional[str] = None
    appointment_slot_minutes: Optional[int] = None
    max_daily_appointments: Optional[int] = None
    operating_hours: Optional[dict] = None


# ─── Vet Clients ────────────────────────────────────────
class VetClientCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone_primary: str
    phone_secondary: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    preferred_contact: str = "phone"
    tags: List[str] = []
    internal_notes: Optional[str] = None
    alert_notes: Optional[str] = None


class VetClientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone_primary: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    tags: Optional[List[str]] = None
    internal_notes: Optional[str] = None
    alert_notes: Optional[str] = None


# ─── Vet Patients ───────────────────────────────────────
class VetPatientCreate(BaseModel):
    client_id: str
    name: str
    species: str
    breed: Optional[str] = None
    color: Optional[str] = None
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    is_dob_estimated: bool = False
    microchip_number: Optional[str] = None
    weight_kg: Optional[float] = None
    allergies: List[str] = []
    chronic_conditions: List[str] = []
    behavioral_alerts: List[str] = []
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    internal_notes: Optional[str] = None


class VetPatientUpdate(BaseModel):
    name: Optional[str] = None
    breed: Optional[str] = None
    color: Optional[str] = None
    sex: Optional[str] = None
    weight_kg: Optional[float] = None
    allergies: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    behavioral_alerts: Optional[List[str]] = None
    insurance_provider: Optional[str] = None
    internal_notes: Optional[str] = None
    is_active: Optional[bool] = None
    is_deceased: Optional[bool] = None


# ─── Vet Appointments ──────────────────────────────────
class VetAppointmentCreate(BaseModel):
    client_id: str
    patient_id: str
    veterinarian_id: str
    appointment_date: str
    start_time: str
    end_time: str
    duration_minutes: int = 20
    appointment_type: str = "wellness_exam"
    reason_for_visit: Optional[str] = None
    exam_room: Optional[str] = None
    client_notes: Optional[str] = None
    internal_notes: Optional[str] = None


class VetAppointmentUpdate(BaseModel):
    status: Optional[str] = None
    exam_room: Optional[str] = None
    internal_notes: Optional[str] = None
    veterinarian_id: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None


# ─── Medical Records (SOAP) ───────────────────────────
class MedicalRecordCreate(BaseModel):
    patient_id: str
    appointment_id: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    vitals: Optional[dict] = None
    diagnoses: List[dict] = []
    procedures_performed: List[dict] = []
    status: str = "draft"


class MedicalRecordUpdate(BaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    vitals: Optional[dict] = None
    diagnoses: Optional[List[dict]] = None
    procedures_performed: Optional[List[dict]] = None
    status: Optional[str] = None
    amendment_reason: Optional[str] = None


# ─── Prescriptions ─────────────────────────────────────
class PrescriptionCreate(BaseModel):
    patient_id: str
    client_id: str
    medical_record_id: Optional[str] = None
    drug_name: str
    drug_strength: str
    drug_form: str = "tablet"
    is_controlled_substance: bool = False
    dea_schedule: Optional[str] = None
    dose: str
    dose_unit: str
    frequency: str
    route: str
    duration_days: Optional[int] = None
    quantity_dispensed: float
    quantity_unit: str
    refills_authorized: int = 0
    client_instructions: str
    pharmacy_instructions: Optional[str] = None
    unit_cost: Optional[float] = None
    total_cost: Optional[float] = None


class PrescriptionUpdate(BaseModel):
    status: Optional[str] = None
    refills_used: Optional[int] = None


# ─── Vaccinations ──────────────────────────────────────
class VaccinationCreate(BaseModel):
    patient_id: str
    vaccine_name: str
    vaccine_type: str = "core"
    manufacturer: Optional[str] = None
    lot_number: Optional[str] = None
    serial_number: Optional[str] = None
    expiry_date: Optional[str] = None
    route: str = "SQ"
    site: Optional[str] = None
    next_due_date: Optional[str] = None
    certificate_number: Optional[str] = None
    rabies_tag_number: Optional[str] = None


# ─── Vet Inventory ─────────────────────────────────────
class VetInventoryCreate(BaseModel):
    name: str
    category: str = "medication"
    sku: Optional[str] = None
    manufacturer: Optional[str] = None
    quantity_on_hand: float = 0
    unit: str = "units"
    reorder_point: float = 5
    reorder_quantity: float = 20
    cost_per_unit: Optional[float] = None
    markup_percentage: float = 100
    selling_price: Optional[float] = None
    is_controlled: bool = False
    dea_schedule: Optional[str] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[str] = None
    storage_location: Optional[str] = None
    primary_supplier: Optional[str] = None


class VetInventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity_on_hand: Optional[float] = None
    reorder_point: Optional[float] = None
    cost_per_unit: Optional[float] = None
    selling_price: Optional[float] = None
    is_active: Optional[bool] = None


# ─── Invoices ──────────────────────────────────────────
class VetInvoiceCreate(BaseModel):
    client_id: str
    appointment_id: Optional[str] = None
    line_items: List[dict] = []
    notes: Optional[str] = None


class VetInvoiceUpdate(BaseModel):
    line_items: Optional[List[dict]] = None
    status: Optional[str] = None
    amount_paid: Optional[float] = None
    notes: Optional[str] = None


# ─── Vet Staff ─────────────────────────────────────────
class VetStaffCreate(BaseModel):
    full_name: str
    role: str = "veterinarian"
    title: Optional[str] = None
    license_number: Optional[str] = None
    email: str
    phone: Optional[str] = None
    specialties: List[str] = []
    color_code: str = "#2563EB"
    max_daily_appointments: int = 20
    work_schedule: Optional[dict] = None
