from pydantic import BaseModel
from typing import List, Optional
from models import new_id, now_iso


# ─── Shelter Profile ───────────────────────────────────
class ShelterOnboarding(BaseModel):
    name: str
    organization_type: str = "private_shelter"
    email: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "IE"
    max_capacity_dogs: int = 50
    max_capacity_cats: int = 50
    max_capacity_other: int = 10


class ShelterUpdate(BaseModel):
    name: Optional[str] = None
    mission_statement: Optional[str] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    max_capacity_dogs: Optional[int] = None
    max_capacity_cats: Optional[int] = None
    operating_hours: Optional[dict] = None
    adoption_fee_dog: Optional[float] = None
    adoption_fee_cat: Optional[float] = None
    adoption_policy: Optional[str] = None


# ─── Animals ───────────────────────────────────────────
class AnimalCreate(BaseModel):
    name: str
    species: str = "dog"
    breed: Optional[str] = None
    breed_secondary: Optional[str] = None
    is_mixed_breed: bool = False
    color: Optional[str] = None
    markings: Optional[str] = None
    sex: Optional[str] = None
    date_of_birth: Optional[str] = None
    estimated_age_months: Optional[int] = None
    weight_kg: Optional[float] = None
    size: Optional[str] = None
    microchip_number: Optional[str] = None
    intake_type: str = "stray"
    intake_condition: str = "healthy"
    intake_notes: Optional[str] = None
    intake_source: Optional[str] = None
    finder_name: Optional[str] = None
    finder_phone: Optional[str] = None
    previous_owner_name: Optional[str] = None
    surrender_reason: Optional[str] = None
    current_location: str = "Kennel A-1"
    location_type: str = "kennel"
    temperament: Optional[str] = None
    energy_level: Optional[str] = None
    good_with_dogs: Optional[bool] = None
    good_with_cats: Optional[bool] = None
    good_with_children: Optional[bool] = None
    house_trained: Optional[bool] = None
    behavioral_notes: Optional[str] = None
    adoption_fee: Optional[float] = None
    ideal_home_description: Optional[str] = None


class AnimalUpdate(BaseModel):
    name: Optional[str] = None
    weight_kg: Optional[float] = None
    adoption_status: Optional[str] = None
    current_location: Optional[str] = None
    location_type: Optional[str] = None
    spay_neuter_status: Optional[str] = None
    vaccination_status: Optional[str] = None
    current_medical_conditions: Optional[List[str]] = None
    temperament: Optional[str] = None
    energy_level: Optional[str] = None
    good_with_dogs: Optional[bool] = None
    good_with_cats: Optional[bool] = None
    good_with_children: Optional[bool] = None
    behavioral_notes: Optional[str] = None
    adoption_fee: Optional[float] = None
    ideal_home_description: Optional[str] = None
    adoption_notes: Optional[str] = None
    is_published: Optional[bool] = None
    featured: Optional[bool] = None
    outcome_type: Optional[str] = None
    outcome_notes: Optional[str] = None


# ─── Adoption Applications ─────────────────────────────
class ApplicationCreate(BaseModel):
    animal_id: str
    applicant_name: str
    applicant_email: str
    applicant_phone: str
    applicant_address: str
    applicant_city: str
    applicant_state: str
    applicant_postal_code: str
    housing_type: Optional[str] = None
    is_homeowner: Optional[bool] = None
    has_yard: Optional[bool] = None
    yard_fenced: Optional[bool] = None
    has_children_under_12: bool = False
    current_pets: List[dict] = []
    pet_experience_level: str = "some_experience"
    reason_for_adopting: Optional[str] = None
    daily_schedule: Optional[str] = None
    hours_pet_alone_daily: Optional[int] = None
    exercise_plan: Optional[str] = None
    why_this_animal: Optional[str] = None
    current_vet_name: Optional[str] = None
    current_vet_clinic: Optional[str] = None
    current_vet_phone: Optional[str] = None


class ApplicationStatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    interview_date: Optional[str] = None
    interview_type: Optional[str] = None
    interview_notes: Optional[str] = None
    home_check_date: Optional[str] = None
    home_check_notes: Optional[str] = None
    home_check_passed: Optional[bool] = None


# ─── Volunteers ────────────────────────────────────────
class VolunteerCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    volunteer_type: List[str] = []
    skills: List[str] = []
    animal_preferences: List[str] = ["dog", "cat"]
    can_handle_large_dogs: bool = False
    availability: Optional[dict] = None
    min_hours_per_week: int = 2
    max_hours_per_week: int = 10
    is_foster: bool = False
    foster_capacity: int = 0


class VolunteerUpdate(BaseModel):
    application_status: Optional[str] = None
    volunteer_type: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    availability: Optional[dict] = None
    is_active: Optional[bool] = None
    is_foster: Optional[bool] = None
    foster_capacity: Optional[int] = None
    internal_notes: Optional[str] = None


# ─── Volunteer Shifts ──────────────────────────────────
class ShiftCreate(BaseModel):
    volunteer_id: str
    shift_date: str
    scheduled_start: str
    scheduled_end: str
    shift_type: str = "dog_walking"
    area_assigned: Optional[str] = None


class ShiftUpdate(BaseModel):
    status: Optional[str] = None
    hours_logged: Optional[float] = None
    tasks_completed: Optional[str] = None
    notes: Optional[str] = None


# ─── Daily Tasks ───────────────────────────────────────
class TaskCreate(BaseModel):
    task_name: str
    category: str = "animal_care"
    description: Optional[str] = None
    priority: str = "normal"
    task_date: Optional[str] = None
    due_time: Optional[str] = None
    assigned_to: Optional[str] = None
    area: Optional[str] = None
    animal_id: Optional[str] = None


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    completion_notes: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None


# ─── Donations ─────────────────────────────────────────
class DonationCreate(BaseModel):
    donor_name: str
    donor_email: Optional[str] = None
    donor_phone: Optional[str] = None
    is_anonymous: bool = False
    donor_type: str = "individual"
    amount: float
    donation_type: str = "one_time"
    payment_method: str = "credit_card"
    designated_fund: Optional[str] = None
    designated_animal_id: Optional[str] = None
    notes: Optional[str] = None


# ─── Medical Records ──────────────────────────────────
class ShelterMedicalCreate(BaseModel):
    animal_id: str
    record_type: str = "treatment"
    title: str
    description: str
    diagnosis: Optional[str] = None
    treatment_plan: Optional[str] = None
    vaccine_name: Optional[str] = None
    vaccine_manufacturer: Optional[str] = None
    vaccine_lot_number: Optional[str] = None
    next_due_date: Optional[str] = None
    medication_name: Optional[str] = None
    medication_dose: Optional[str] = None
    medication_frequency: Optional[str] = None
    medication_start_date: Optional[str] = None
    medication_end_date: Optional[str] = None
    veterinarian_name: Optional[str] = None
    cost: float = 0
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None


# ─── Campaigns ─────────────────────────────────────────
class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str = "general"
    goal_amount: Optional[float] = None
    start_date: str
    end_date: str
    story: Optional[str] = None
