from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from models import new_id, now_iso
from auth_utils import get_current_user, hash_password
import random

router = APIRouter(prefix="/api/vet")


def get_db():
    from server import db
    return db


# ═══════════════════════════════════════════════════════════
# HELPER
# ═══════════════════════════════════════════════════════════

async def _get_clinic_id(current_user, db):
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user or not user.get("vet_clinic_id"):
        raise HTTPException(status_code=404, detail="Vet clinic not found")
    return user["vet_clinic_id"]


# ═══════════════════════════════════════════════════════════
# CLINIC PROFILE
# ═══════════════════════════════════════════════════════════

@router.post("/onboarding")
async def onboard_vet_clinic(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    existing = await db.vet_clinics.find_one({"user_id": current_user["sub"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Vet clinic already exists")

    clinic_id = new_id()
    now = now_iso()
    clinic_doc = {
        "id": clinic_id,
        "user_id": current_user["sub"],
        "name": data.get("name", "My Vet Clinic"),
        "clinic_type": data.get("clinic_type", "general"),
        "tagline": None,
        "description": None,
        "logo_url": None,
        "email": data.get("email", current_user["email"]),
        "phone": data.get("phone"),
        "emergency_phone": None,
        "address_line1": data.get("address_line1"),
        "city": data.get("city"),
        "state": data.get("state"),
        "postal_code": data.get("postal_code"),
        "country": data.get("country", "IE"),
        "appointment_slot_minutes": 20,
        "buffer_between_appointments": 5,
        "max_daily_appointments": 40,
        "default_currency": "EUR",
        "tax_rate": 23.0,
        "operating_hours": {
            "monday": {"start": "08:00", "end": "18:00", "is_open": True},
            "tuesday": {"start": "08:00", "end": "18:00", "is_open": True},
            "wednesday": {"start": "08:00", "end": "18:00", "is_open": True},
            "thursday": {"start": "08:00", "end": "18:00", "is_open": True},
            "friday": {"start": "08:00", "end": "18:00", "is_open": True},
            "saturday": {"start": "09:00", "end": "13:00", "is_open": True},
            "sunday": {"start": "00:00", "end": "00:00", "is_open": False},
        },
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.vet_clinics.insert_one(clinic_doc)
    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"vet_clinic_id": clinic_id, "product_type": "vet_clinic"}}
    )
    clinic_doc.pop("_id", None)
    return clinic_doc


@router.get("/clinic")
async def get_clinic(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    clinic = await db.vet_clinics.find_one({"id": clinic_id}, {"_id": 0})
    return clinic


@router.put("/clinic")
async def update_clinic(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    await db.vet_clinics.update_one({"id": clinic_id}, {"$set": update})
    clinic = await db.vet_clinics.find_one({"id": clinic_id}, {"_id": 0})
    return clinic


# ═══════════════════════════════════════════════════════════
# STAFF
# ═══════════════════════════════════════════════════════════

@router.get("/staff")
async def get_staff(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    staff = await db.vet_staff.find({"clinic_id": clinic_id}, {"_id": 0}).to_list(100)
    return staff


@router.post("/staff")
async def create_staff(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "full_name": data.get("full_name", ""),
        "role": data.get("role", "veterinarian"),
        "title": data.get("title"),
        "license_number": data.get("license_number"),
        "email": data.get("email", ""),
        "phone": data.get("phone"),
        "specialties": data.get("specialties", []),
        "color_code": data.get("color_code", "#2563EB"),
        "max_daily_appointments": data.get("max_daily_appointments", 20),
        "work_schedule": data.get("work_schedule", {}),
        "is_active": True,
        "created_at": now, "updated_at": now,
    }
    await db.vet_staff.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# CLIENTS
# ═══════════════════════════════════════════════════════════

@router.get("/clients")
async def get_clients(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    clients = await db.vet_clients.find({"clinic_id": clinic_id, "is_active": True}, {"_id": 0}).to_list(500)
    # Enrich with pet count
    for c in clients:
        c["pet_count"] = await db.vet_patients.count_documents({"clinic_id": clinic_id, "client_id": c["id"], "is_active": True})
    return clients


@router.post("/clients")
async def create_client(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "first_name": data.get("first_name", ""),
        "last_name": data.get("last_name", ""),
        "email": data.get("email"),
        "phone_primary": data.get("phone_primary", ""),
        "phone_secondary": data.get("phone_secondary"),
        "preferred_contact": data.get("preferred_contact", "phone"),
        "address_line1": data.get("address_line1"),
        "city": data.get("city"),
        "state": data.get("state"),
        "postal_code": data.get("postal_code"),
        "country": "IE",
        "balance": 0, "credit": 0,
        "tags": data.get("tags", []),
        "internal_notes": data.get("internal_notes"),
        "alert_notes": data.get("alert_notes"),
        "is_active": True,
        "client_since": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "total_visits": 0, "total_spent": 0,
        "created_at": now, "updated_at": now,
    }
    await db.vet_clients.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/clients/{client_id}")
async def get_client(client_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    client = await db.vet_clients.find_one({"id": client_id, "clinic_id": clinic_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    # Get pets
    client["pets"] = await db.vet_patients.find({"clinic_id": clinic_id, "client_id": client_id}, {"_id": 0}).to_list(50)
    return client


# ═══════════════════════════════════════════════════════════
# PATIENTS
# ═══════════════════════════════════════════════════════════

@router.get("/patients")
async def get_patients(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    patients = await db.vet_patients.find({"clinic_id": clinic_id, "is_active": True}, {"_id": 0}).to_list(500)
    # Enrich with client names
    client_ids = list(set(p.get("client_id") for p in patients if p.get("client_id")))
    if client_ids:
        clients = await db.vet_clients.find({"id": {"$in": client_ids}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "phone_primary": 1}).to_list(500)
        cmap = {c["id"]: c for c in clients}
        for p in patients:
            c = cmap.get(p.get("client_id"), {})
            p["client_name"] = f"{c.get('first_name', '')} {c.get('last_name', '')}".strip()
            p["client_phone"] = c.get("phone_primary", "")
    return patients


@router.post("/patients")
async def create_patient(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "client_id": data.get("client_id", ""),
        "name": data.get("name", ""),
        "species": data.get("species", "canine"),
        "breed": data.get("breed"),
        "color": data.get("color"),
        "sex": data.get("sex"),
        "date_of_birth": data.get("date_of_birth"),
        "is_dob_estimated": data.get("is_dob_estimated", False),
        "microchip_number": data.get("microchip_number"),
        "weight_kg": data.get("weight_kg"),
        "weight_updated_at": now if data.get("weight_kg") else None,
        "body_condition_score": data.get("body_condition_score"),
        "allergies": data.get("allergies", []),
        "chronic_conditions": data.get("chronic_conditions", []),
        "current_medications": data.get("current_medications", []),
        "behavioral_alerts": data.get("behavioral_alerts", []),
        "insurance_provider": data.get("insurance_provider"),
        "insurance_policy_number": data.get("insurance_policy_number"),
        "spay_neuter_date": data.get("spay_neuter_date"),
        "is_active": True, "is_deceased": False,
        "photo_url": None, "photos": [],
        "internal_notes": data.get("internal_notes"),
        "created_at": now, "updated_at": now,
    }
    await db.vet_patients.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    patient = await db.vet_patients.find_one({"id": patient_id, "clinic_id": clinic_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    # Get client
    client = await db.vet_clients.find_one({"id": patient.get("client_id")}, {"_id": 0})
    if client:
        patient["client"] = client
    # Get records
    patient["medical_records"] = await db.vet_medical_records.find(
        {"patient_id": patient_id, "clinic_id": clinic_id}, {"_id": 0}
    ).sort("record_date", -1).to_list(100)
    patient["vaccinations"] = await db.vet_vaccinations.find(
        {"patient_id": patient_id, "clinic_id": clinic_id}, {"_id": 0}
    ).sort("administered_date", -1).to_list(100)
    patient["prescriptions"] = await db.vet_prescriptions.find(
        {"patient_id": patient_id, "clinic_id": clinic_id}, {"_id": 0}
    ).sort("prescribed_date", -1).to_list(100)
    return patient


@router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    if "weight_kg" in update:
        update["weight_updated_at"] = now_iso()
    await db.vet_patients.update_one({"id": patient_id, "clinic_id": clinic_id}, {"$set": update})
    patient = await db.vet_patients.find_one({"id": patient_id}, {"_id": 0})
    return patient


# ═══════════════════════════════════════════════════════════
# APPOINTMENTS
# ═══════════════════════════════════════════════════════════

@router.get("/appointments")
async def get_appointments(
    date_from: str = None, date_to: str = None, status: str = None,
    vet_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    query = {"clinic_id": clinic_id}
    if status:
        query["status"] = status
    if date_from:
        query.setdefault("appointment_date", {})["$gte"] = date_from
    if date_to:
        query.setdefault("appointment_date", {})["$lte"] = date_to
    if vet_id:
        query["veterinarian_id"] = vet_id

    appointments = await db.vet_appointments.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)
    # Enrich
    patient_ids = list(set(a.get("patient_id") for a in appointments if a.get("patient_id")))
    client_ids = list(set(a.get("client_id") for a in appointments if a.get("client_id")))
    vet_ids = list(set(a.get("veterinarian_id") for a in appointments if a.get("veterinarian_id")))

    patients = {}
    clients = {}
    vets = {}
    if patient_ids:
        for p in await db.vet_patients.find({"id": {"$in": patient_ids}}, {"_id": 0, "id": 1, "name": 1, "species": 1, "breed": 1, "weight_kg": 1, "allergies": 1, "behavioral_alerts": 1}).to_list(500):
            patients[p["id"]] = p
    if client_ids:
        for c in await db.vet_clients.find({"id": {"$in": client_ids}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "phone_primary": 1}).to_list(500):
            clients[c["id"]] = c
    if vet_ids:
        for v in await db.vet_staff.find({"id": {"$in": vet_ids}}, {"_id": 0, "id": 1, "full_name": 1, "color_code": 1}).to_list(100):
            vets[v["id"]] = v

    for a in appointments:
        p = patients.get(a.get("patient_id"), {})
        c = clients.get(a.get("client_id"), {})
        v = vets.get(a.get("veterinarian_id"), {})
        a["patient_name"] = p.get("name", "")
        a["patient_species"] = p.get("species", "")
        a["patient_breed"] = p.get("breed", "")
        a["patient_allergies"] = p.get("allergies", [])
        a["client_name"] = f"{c.get('first_name', '')} {c.get('last_name', '')}".strip()
        a["client_phone"] = c.get("phone_primary", "")
        a["vet_name"] = v.get("full_name", "")
        a["vet_color"] = v.get("color_code", "#2563EB")

    return appointments


@router.post("/appointments")
async def create_appointment(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "client_id": data.get("client_id"),
        "patient_id": data.get("patient_id"),
        "veterinarian_id": data.get("veterinarian_id"),
        "appointment_date": data.get("appointment_date"),
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "duration_minutes": data.get("duration_minutes", 20),
        "appointment_type": data.get("appointment_type", "wellness_exam"),
        "reason_for_visit": data.get("reason_for_visit"),
        "status": "scheduled",
        "exam_room": data.get("exam_room"),
        "client_notes": data.get("client_notes"),
        "internal_notes": data.get("internal_notes"),
        "reminder_sent": False,
        "confirmation_received": False,
        "created_at": now, "updated_at": now,
    }
    await db.vet_appointments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/appointments/{appt_id}")
async def update_appointment(appt_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    if "status" in update:
        update["status_changed_at"] = now_iso()
        if update["status"] == "checked_in":
            update["checked_in_at"] = now_iso()
        elif update["status"] == "with_doctor":
            update["exam_started_at"] = now_iso()
        elif update["status"] == "completed":
            update["checked_out_at"] = now_iso()
    await db.vet_appointments.update_one({"id": appt_id, "clinic_id": clinic_id}, {"$set": update})
    appt = await db.vet_appointments.find_one({"id": appt_id}, {"_id": 0})
    return appt


# ═══════════════════════════════════════════════════════════
# MEDICAL RECORDS (SOAP)
# ═══════════════════════════════════════════════════════════

@router.get("/medical-records")
async def get_medical_records(patient_id: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    query = {"clinic_id": clinic_id}
    if patient_id:
        query["patient_id"] = patient_id
    records = await db.vet_medical_records.find(query, {"_id": 0}).sort("record_date", -1).to_list(200)
    return records


@router.post("/medical-records")
async def create_medical_record(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "patient_id": data.get("patient_id"),
        "appointment_id": data.get("appointment_id"),
        "veterinarian_id": current_user["sub"],
        "veterinarian_name": user.get("full_name", "Doctor"),
        "record_date": now,
        "subjective": data.get("subjective", ""),
        "objective": data.get("objective", ""),
        "assessment": data.get("assessment", ""),
        "plan": data.get("plan", ""),
        "vitals": data.get("vitals", {}),
        "diagnoses": data.get("diagnoses", []),
        "procedures_performed": data.get("procedures_performed", []),
        "ai_generated": False,
        "status": data.get("status", "draft"),
        "finalized_at": None,
        "parent_record_id": None,
        "amendment_reason": None,
        "attachments": [],
        "created_at": now, "updated_at": now,
    }
    await db.vet_medical_records.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/medical-records/{record_id}")
async def update_medical_record(record_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    record = await db.vet_medical_records.find_one({"id": record_id, "clinic_id": clinic_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    # Can't edit finalized records - must create amendment
    if record.get("status") == "finalized" and data.get("status") != "amended":
        raise HTTPException(status_code=400, detail="Cannot edit finalized records. Create an amendment instead.")

    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    if data.get("status") == "finalized":
        update["finalized_at"] = now_iso()
        update["finalized_by"] = current_user["sub"]
    await db.vet_medical_records.update_one({"id": record_id}, {"$set": update})
    record = await db.vet_medical_records.find_one({"id": record_id}, {"_id": 0})
    return record


@router.get("/medical-records/{record_id}")
async def get_medical_record(record_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    record = await db.vet_medical_records.find_one({"id": record_id, "clinic_id": clinic_id}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


# ═══════════════════════════════════════════════════════════
# PRESCRIPTIONS
# ═══════════════════════════════════════════════════════════

@router.get("/prescriptions")
async def get_prescriptions(patient_id: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    query = {"clinic_id": clinic_id}
    if patient_id:
        query["patient_id"] = patient_id
    prescriptions = await db.vet_prescriptions.find(query, {"_id": 0}).sort("prescribed_date", -1).to_list(200)
    return prescriptions


@router.post("/prescriptions")
async def create_prescription(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "patient_id": data.get("patient_id"),
        "client_id": data.get("client_id"),
        "medical_record_id": data.get("medical_record_id"),
        "prescriber_id": current_user["sub"],
        "prescriber_name": user.get("full_name", "Doctor"),
        "prescriber_license": data.get("prescriber_license", ""),
        "drug_name": data.get("drug_name", ""),
        "drug_strength": data.get("drug_strength", ""),
        "drug_form": data.get("drug_form", "tablet"),
        "is_controlled_substance": data.get("is_controlled_substance", False),
        "dea_schedule": data.get("dea_schedule"),
        "dose": data.get("dose", ""),
        "dose_unit": data.get("dose_unit", "mg"),
        "frequency": data.get("frequency", "BID"),
        "route": data.get("route", "PO"),
        "duration_days": data.get("duration_days"),
        "quantity_dispensed": data.get("quantity_dispensed", 0),
        "quantity_unit": data.get("quantity_unit", "tablets"),
        "refills_authorized": data.get("refills_authorized", 0),
        "refills_used": 0,
        "client_instructions": data.get("client_instructions", ""),
        "pharmacy_instructions": data.get("pharmacy_instructions"),
        "label_text": data.get("label_text"),
        "status": "active",
        "prescribed_date": now,
        "unit_cost": data.get("unit_cost"),
        "total_cost": data.get("total_cost"),
        "created_at": now, "updated_at": now,
    }
    await db.vet_prescriptions.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# VACCINATIONS
# ═══════════════════════════════════════════════════════════

@router.get("/vaccinations")
async def get_vaccinations(patient_id: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    query = {"clinic_id": clinic_id}
    if patient_id:
        query["patient_id"] = patient_id
    vaccinations = await db.vet_vaccinations.find(query, {"_id": 0}).sort("administered_date", -1).to_list(200)
    return vaccinations


@router.post("/vaccinations")
async def create_vaccination(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "patient_id": data.get("patient_id"),
        "vaccine_name": data.get("vaccine_name", ""),
        "vaccine_type": data.get("vaccine_type", "core"),
        "manufacturer": data.get("manufacturer"),
        "lot_number": data.get("lot_number"),
        "serial_number": data.get("serial_number"),
        "expiry_date": data.get("expiry_date"),
        "administered_by": current_user["sub"],
        "administered_date": now,
        "route": data.get("route", "SQ"),
        "site": data.get("site"),
        "next_due_date": data.get("next_due_date"),
        "reminder_sent": False,
        "certificate_number": data.get("certificate_number"),
        "rabies_tag_number": data.get("rabies_tag_number"),
        "adverse_reaction": False,
        "created_at": now,
    }
    await db.vet_vaccinations.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# INVENTORY
# ═══════════════════════════════════════════════════════════

@router.get("/inventory")
async def get_inventory(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    items = await db.vet_inventory.find({"clinic_id": clinic_id, "is_active": True}, {"_id": 0}).to_list(500)
    for item in items:
        item["is_low_stock"] = item.get("quantity_on_hand", 0) <= item.get("reorder_point", 5)
    return items


@router.post("/inventory")
async def create_inventory(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        **{k: v for k, v in data.items()},
        "is_active": True, "created_at": now, "updated_at": now,
    }
    await db.vet_inventory.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# INVOICES
# ═══════════════════════════════════════════════════════════

@router.get("/invoices")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    invoices = await db.vet_invoices.find({"clinic_id": clinic_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return invoices


@router.post("/invoices")
async def create_invoice(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    now = now_iso()
    line_items = data.get("line_items", [])
    subtotal = sum(item.get("amount", 0) for item in line_items)
    tax = subtotal * 0.23
    total = subtotal + tax

    # Generate invoice number
    count = await db.vet_invoices.count_documents({"clinic_id": clinic_id})
    inv_number = f"INV-{datetime.now(timezone.utc).strftime('%Y')}-{count + 1:04d}"

    doc = {
        "id": new_id(), "clinic_id": clinic_id,
        "client_id": data.get("client_id"),
        "appointment_id": data.get("appointment_id"),
        "invoice_number": inv_number,
        "line_items": line_items,
        "subtotal": subtotal,
        "discount_total": 0,
        "tax_total": round(tax, 2),
        "total": round(total, 2),
        "amount_paid": 0,
        "balance_due": round(total, 2),
        "status": "draft",
        "invoice_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "notes": data.get("notes"),
        "payments": [],
        "created_at": now, "updated_at": now,
    }
    await db.vet_invoices.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# DASHBOARD STATS
# ═══════════════════════════════════════════════════════════

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    clinic_id = await _get_clinic_id(current_user, db)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    today_appts = await db.vet_appointments.find(
        {"clinic_id": clinic_id, "appointment_date": today}, {"_id": 0}
    ).to_list(100)

    total_patients = await db.vet_patients.count_documents({"clinic_id": clinic_id, "is_active": True})
    total_clients = await db.vet_clients.count_documents({"clinic_id": clinic_id, "is_active": True})

    # Status counts
    status_counts = {}
    for a in today_appts:
        s = a.get("status", "scheduled")
        status_counts[s] = status_counts.get(s, 0) + 1

    # Week revenue
    week_data = []
    for i in range(6, -1, -1):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        day_invoices = await db.vet_invoices.find(
            {"clinic_id": clinic_id, "invoice_date": d}, {"_id": 0, "total": 1}
        ).to_list(100)
        rev = sum(inv.get("total", 0) for inv in day_invoices)
        week_data.append({"date": d, "revenue": rev})

    return {
        "today_appointments": len(today_appts),
        "today_status_counts": status_counts,
        "total_patients": total_patients,
        "total_clients": total_clients,
        "week_revenue": week_data,
        "today_schedule": today_appts,
    }


# ═══════════════════════════════════════════════════════════
# SEED DATA
# ═══════════════════════════════════════════════════════════

@router.post("/seed")
async def seed_vet_data():
    db = get_db()
    demo_email = "vet@pawparadise.com"
    existing = await db.users.find_one({"email": demo_email}, {"_id": 0})
    if existing:
        return {"message": "Vet demo data already exists", "email": demo_email, "password": "demo123"}

    user_id = new_id()
    clinic_id = new_id()
    now = now_iso()
    today = datetime.now(timezone.utc)

    # Create user
    await db.users.insert_one({
        "id": user_id, "email": demo_email,
        "password_hash": hash_password("demo123"),
        "full_name": "Dr. Sarah O'Brien",
        "role": "vet_clinic", "product_type": "vet_clinic",
        "avatar_url": None, "vet_clinic_id": clinic_id,
        "created_at": now, "updated_at": now,
    })

    # Create clinic
    await db.vet_clinics.insert_one({
        "id": clinic_id, "user_id": user_id,
        "name": "Dublin Veterinary Clinic",
        "clinic_type": "general",
        "tagline": "Compassionate care for your companions",
        "description": "Full-service veterinary hospital offering wellness, surgery, dentistry, and emergency care.",
        "email": demo_email, "phone": "+353 1 555 0100",
        "emergency_phone": "+353 1 555 0199",
        "address_line1": "123 Merrion Square", "city": "Dublin", "state": "Dublin",
        "postal_code": "D02 PH42", "country": "IE",
        "appointment_slot_minutes": 20, "buffer_between_appointments": 5,
        "max_daily_appointments": 40, "default_currency": "EUR", "tax_rate": 23.0,
        "operating_hours": {
            "monday": {"start": "08:00", "end": "18:00", "is_open": True},
            "tuesday": {"start": "08:00", "end": "18:00", "is_open": True},
            "wednesday": {"start": "08:00", "end": "18:00", "is_open": True},
            "thursday": {"start": "08:00", "end": "20:00", "is_open": True},
            "friday": {"start": "08:00", "end": "18:00", "is_open": True},
            "saturday": {"start": "09:00", "end": "13:00", "is_open": True},
            "sunday": {"start": "00:00", "end": "00:00", "is_open": False},
        },
        "is_active": True, "created_at": now, "updated_at": now,
    })

    # Create staff/vets
    vets = [
        {"id": new_id(), "full_name": "Dr. Sarah O'Brien", "role": "veterinarian", "title": "Lead Veterinarian", "license_number": "VET-2018-1234", "email": "sarah@dublinvet.ie", "specialties": ["general", "surgery"], "color_code": "#0891B2"},
        {"id": new_id(), "full_name": "Dr. Michael Chen", "role": "veterinarian", "title": "Associate Veterinarian", "license_number": "VET-2020-5678", "email": "michael@dublinvet.ie", "specialties": ["dentistry", "dermatology"], "color_code": "#7C3AED"},
        {"id": new_id(), "full_name": "Lisa Murphy", "role": "technician", "title": "Senior Vet Tech", "license_number": "TECH-2019-9012", "email": "lisa@dublinvet.ie", "specialties": ["lab", "anesthesia"], "color_code": "#059669"},
        {"id": new_id(), "full_name": "Anna Kelly", "role": "receptionist", "title": "Front Desk", "license_number": None, "email": "anna@dublinvet.ie", "specialties": [], "color_code": "#D97706"},
    ]
    for v in vets:
        await db.vet_staff.insert_one({
            **v, "clinic_id": clinic_id, "phone": None, "avatar_url": None,
            "max_daily_appointments": 20 if v["role"] == "veterinarian" else 0,
            "work_schedule": {}, "is_active": True, "created_at": now, "updated_at": now,
        })

    # Create clients and patients
    clients_data = [
        {"id": new_id(), "first_name": "Emma", "last_name": "O'Sullivan", "email": "emma.os@example.com", "phone_primary": "+353 87 123 4567", "city": "Dublin"},
        {"id": new_id(), "first_name": "James", "last_name": "Murphy", "email": "james.m@example.com", "phone_primary": "+353 86 234 5678", "city": "Dublin"},
        {"id": new_id(), "first_name": "Aoife", "last_name": "Kelly", "email": "aoife.k@example.com", "phone_primary": "+353 85 345 6789", "city": "Bray"},
        {"id": new_id(), "first_name": "Liam", "last_name": "Walsh", "email": "liam.w@example.com", "phone_primary": "+353 87 456 7890", "city": "Dun Laoghaire"},
        {"id": new_id(), "first_name": "Ciara", "last_name": "Doyle", "email": "ciara.d@example.com", "phone_primary": "+353 86 567 8901", "city": "Blackrock"},
        {"id": new_id(), "first_name": "Niamh", "last_name": "Ryan", "email": "niamh.r@example.com", "phone_primary": "+353 85 678 9012", "city": "Dalkey"},
    ]
    for c in clients_data:
        await db.vet_clients.insert_one({
            **c, "clinic_id": clinic_id, "preferred_contact": "phone",
            "address_line1": None, "state": "Dublin", "postal_code": None, "country": "IE",
            "balance": 0, "credit": 0, "tags": [], "internal_notes": None, "alert_notes": None,
            "is_active": True, "client_since": "2024-01-15", "total_visits": random.randint(3, 20),
            "total_spent": round(random.uniform(200, 2500), 2),
            "created_at": now, "updated_at": now,
        })

    patients_data = [
        {"id": new_id(), "client_id": clients_data[0]["id"], "name": "Buddy", "species": "canine", "breed": "Labrador Retriever", "color": "Golden", "sex": "male_neutered", "date_of_birth": "2021-03-15", "weight_kg": 32.5, "allergies": ["Chicken"], "chronic_conditions": [], "behavioral_alerts": []},
        {"id": new_id(), "client_id": clients_data[0]["id"], "name": "Whiskers", "species": "feline", "breed": "Domestic Shorthair", "color": "Tabby", "sex": "female_spayed", "date_of_birth": "2020-07-22", "weight_kg": 4.2, "allergies": [], "chronic_conditions": ["Hyperthyroidism"], "behavioral_alerts": ["Nervous with strangers"]},
        {"id": new_id(), "client_id": clients_data[1]["id"], "name": "Max", "species": "canine", "breed": "German Shepherd", "color": "Black and Tan", "sex": "male_intact", "date_of_birth": "2022-11-01", "weight_kg": 38.0, "allergies": [], "chronic_conditions": [], "behavioral_alerts": ["Reactive to other dogs"]},
        {"id": new_id(), "client_id": clients_data[2]["id"], "name": "Luna", "species": "feline", "breed": "Persian", "color": "White", "sex": "female_spayed", "date_of_birth": "2019-05-10", "weight_kg": 3.8, "allergies": ["Penicillin"], "chronic_conditions": ["Chronic Kidney Disease Stage 2"], "behavioral_alerts": []},
        {"id": new_id(), "client_id": clients_data[3]["id"], "name": "Charlie", "species": "canine", "breed": "Cavalier King Charles", "color": "Blenheim", "sex": "male_neutered", "date_of_birth": "2023-01-20", "weight_kg": 8.5, "allergies": [], "chronic_conditions": ["Heart murmur Grade II"], "behavioral_alerts": []},
        {"id": new_id(), "client_id": clients_data[4]["id"], "name": "Bella", "species": "canine", "breed": "Golden Retriever", "color": "Golden", "sex": "female_spayed", "date_of_birth": "2020-09-08", "weight_kg": 28.0, "allergies": [], "chronic_conditions": [], "behavioral_alerts": []},
        {"id": new_id(), "client_id": clients_data[5]["id"], "name": "Oscar", "species": "feline", "breed": "Maine Coon", "color": "Brown Tabby", "sex": "male_neutered", "date_of_birth": "2021-12-03", "weight_kg": 7.2, "allergies": [], "chronic_conditions": [], "behavioral_alerts": ["May bite when stressed"]},
        {"id": new_id(), "client_id": clients_data[3]["id"], "name": "Rosie", "species": "canine", "breed": "Cockapoo", "color": "Apricot", "sex": "female_intact", "date_of_birth": "2024-04-15", "weight_kg": 6.0, "allergies": [], "chronic_conditions": [], "behavioral_alerts": []},
    ]
    for p in patients_data:
        await db.vet_patients.insert_one({
            **p, "clinic_id": clinic_id,
            "is_dob_estimated": False, "microchip_number": f"985{random.randint(100000000, 999999999)}",
            "weight_updated_at": now, "body_condition_score": random.choice([4, 5, 5, 5, 6]),
            "current_medications": [], "insurance_provider": None,
            "is_active": True, "is_deceased": False, "photo_url": None, "photos": [],
            "internal_notes": None, "created_at": now, "updated_at": now,
        })

    # Create today's appointments
    appt_types = ["wellness_exam", "sick_visit", "vaccination", "dental", "follow_up", "surgery"]
    exam_rooms = ["Exam 1", "Exam 2", "Exam 3", "Surgery"]
    statuses_flow = ["scheduled", "confirmed", "checked_in", "with_doctor", "in_treatment", "checking_out", "completed"]
    today_str = today.strftime("%Y-%m-%d")

    times_list = [
        ("08:00", "08:20"), ("08:30", "08:50"), ("09:00", "09:20"), ("09:30", "09:50"),
        ("10:00", "10:20"), ("10:30", "11:30"), ("11:00", "11:20"), ("11:30", "11:50"),
        ("14:00", "14:20"), ("14:30", "14:50"), ("15:00", "15:20"), ("15:30", "15:50"),
    ]

    today_statuses = ["completed", "completed", "completed", "checking_out", "with_doctor", "in_treatment", "checked_in", "confirmed", "scheduled", "scheduled", "scheduled", "scheduled"]

    for i, (start, end) in enumerate(times_list):
        pat = patients_data[i % len(patients_data)]
        vet = vets[i % 2]  # Alternate between two vets
        client = next(c for c in clients_data if c["id"] == pat["client_id"])
        await db.vet_appointments.insert_one({
            "id": new_id(), "clinic_id": clinic_id,
            "client_id": client["id"], "patient_id": pat["id"],
            "veterinarian_id": vet["id"],
            "appointment_date": today_str,
            "start_time": f"{today_str}T{start}:00",
            "end_time": f"{today_str}T{end}:00",
            "duration_minutes": 20,
            "appointment_type": appt_types[i % len(appt_types)],
            "reason_for_visit": ["Annual wellness check", "Limping on right front leg", "Rabies booster due", "Dental cleaning", "Recheck ear infection", "Spay surgery"][i % 6],
            "status": today_statuses[i] if i < len(today_statuses) else "scheduled",
            "exam_room": exam_rooms[i % len(exam_rooms)],
            "client_notes": None, "internal_notes": None,
            "reminder_sent": True, "confirmation_received": i < 8,
            "created_at": now, "updated_at": now,
        })

    # Create some medical records
    for i in range(5):
        pat = patients_data[i]
        vet = vets[i % 2]
        record_date = (today - timedelta(days=random.randint(1, 90))).isoformat()
        await db.vet_medical_records.insert_one({
            "id": new_id(), "clinic_id": clinic_id,
            "patient_id": pat["id"], "appointment_id": None,
            "veterinarian_id": vet["id"], "veterinarian_name": vet["full_name"],
            "record_date": record_date,
            "subjective": f"Owner reports {pat['name']} has been {'eating well and active' if i % 2 == 0 else 'lethargic for 2 days with decreased appetite'}.",
            "objective": f"T: {round(38.2 + random.uniform(-0.5, 1.0), 1)}°C, HR: {random.randint(80, 140)} bpm, RR: {random.randint(16, 30)}. Weight: {pat.get('weight_kg', 10)}kg. {'Bright, alert, responsive. No abnormalities detected on physical exam.' if i % 2 == 0 else 'Mild dehydration. Tender abdomen on palpation.'}",
            "assessment": ["Healthy patient - routine wellness", "Acute gastroenteritis", "Dental disease Grade 2", "Otitis externa - right ear", "Routine vaccination visit"][i],
            "plan": ["Continue current diet. Schedule dental cleaning in 6 months. Heartworm prevention ongoing.", "SQ fluids 150ml. Metronidazole 250mg BID x 7 days. Bland diet 48hrs. Recheck if not improved in 3 days.", "Schedule dental cleaning under GA. Pre-anesthetic bloodwork required.", "Ear flush performed. Otomax BID x 14 days. Recheck in 2 weeks.", "DHPP and Bordetella administered. Rabies due next visit."][i],
            "vitals": {"temperature_c": round(38.2 + random.uniform(-0.5, 1.0), 1), "heart_rate_bpm": random.randint(80, 140), "respiratory_rate": random.randint(16, 30), "weight_kg": pat.get("weight_kg", 10), "body_condition_score": 5, "pain_score": 0 if i % 2 == 0 else 2},
            "diagnoses": [{"code": f"D{i+1}", "name": ["Healthy", "Gastroenteritis", "Periodontal disease", "Otitis externa", "Vaccination visit"][i]}],
            "procedures_performed": [],
            "ai_generated": False, "status": "finalized",
            "finalized_at": record_date, "parent_record_id": None,
            "attachments": [], "created_at": record_date, "updated_at": record_date,
        })

    # Create vaccinations
    vaccine_names = ["DHPP", "Rabies", "Bordetella", "Leptospirosis", "FVRCP", "FeLV"]
    for pat in patients_data:
        num_vaccines = random.randint(2, 4)
        for j in range(num_vaccines):
            vax_date = (today - timedelta(days=random.randint(30, 365))).isoformat()
            next_due = (today + timedelta(days=random.randint(30, 365))).strftime("%Y-%m-%d")
            vname = vaccine_names[j % len(vaccine_names)]
            if pat["species"] == "feline" and vname in ["DHPP", "Bordetella", "Leptospirosis"]:
                vname = ["FVRCP", "Rabies", "FeLV"][j % 3]
            await db.vet_vaccinations.insert_one({
                "id": new_id(), "clinic_id": clinic_id,
                "patient_id": pat["id"],
                "vaccine_name": vname,
                "vaccine_type": "core" if vname in ["DHPP", "Rabies", "FVRCP"] else "non_core",
                "manufacturer": random.choice(["Zoetis", "Boehringer Ingelheim", "Merck"]),
                "lot_number": f"LOT{random.randint(10000, 99999)}",
                "serial_number": None,
                "expiry_date": (today + timedelta(days=random.randint(180, 730))).strftime("%Y-%m-%d"),
                "administered_by": vets[0]["id"],
                "administered_date": vax_date,
                "route": "SQ", "site": "Right shoulder",
                "next_due_date": next_due,
                "reminder_sent": False,
                "adverse_reaction": False,
                "created_at": vax_date,
            })

    # Create prescriptions
    rx_data = [
        {"drug_name": "Metronidazole", "drug_strength": "250mg", "drug_form": "tablet", "dose": "250mg", "frequency": "BID", "route": "PO", "duration_days": 7, "quantity_dispensed": 14, "client_instructions": "Give 1 tablet by mouth twice daily for 7 days. Give with food."},
        {"drug_name": "Otomax", "drug_strength": "15g", "drug_form": "otic", "dose": "4 drops", "frequency": "BID", "route": "Otic", "duration_days": 14, "quantity_dispensed": 1, "client_instructions": "Apply 4 drops to right ear twice daily for 14 days."},
        {"drug_name": "Carprofen", "drug_strength": "75mg", "drug_form": "chewable", "dose": "75mg", "frequency": "SID", "route": "PO", "duration_days": 5, "quantity_dispensed": 5, "client_instructions": "Give 1 chewable tablet by mouth once daily for 5 days. Give with food."},
    ]
    for i, rx in enumerate(rx_data):
        pat = patients_data[i + 1]
        client = next(c for c in clients_data if c["id"] == pat["client_id"])
        await db.vet_prescriptions.insert_one({
            "id": new_id(), "clinic_id": clinic_id,
            "patient_id": pat["id"], "client_id": client["id"],
            "prescriber_id": vets[0]["id"], "prescriber_name": vets[0]["full_name"],
            "prescriber_license": "VET-2018-1234",
            **rx, "dose_unit": "mg", "quantity_unit": "tablets" if rx["drug_form"] == "tablet" else "tube",
            "is_controlled_substance": False, "dea_schedule": None,
            "refills_authorized": 0, "refills_used": 0,
            "pharmacy_instructions": None, "label_text": None,
            "status": "active",
            "prescribed_date": (today - timedelta(days=random.randint(1, 14))).isoformat(),
            "unit_cost": round(random.uniform(0.5, 5.0), 2),
            "total_cost": round(random.uniform(10, 80), 2),
            "created_at": now, "updated_at": now,
        })

    # Create inventory
    vet_inv = [
        {"name": "Metronidazole 250mg (100ct)", "category": "medication", "quantity_on_hand": 85, "reorder_point": 20, "cost_per_unit": 0.45, "selling_price": 2.50, "manufacturer": "Teva"},
        {"name": "Carprofen 75mg (60ct)", "category": "medication", "quantity_on_hand": 42, "reorder_point": 15, "cost_per_unit": 1.20, "selling_price": 4.00, "manufacturer": "Zoetis"},
        {"name": "DHPP Vaccine (25 dose)", "category": "vaccine", "quantity_on_hand": 18, "reorder_point": 5, "cost_per_unit": 8.50, "selling_price": 25.00, "manufacturer": "Boehringer Ingelheim"},
        {"name": "Rabies Vaccine (10 dose)", "category": "vaccine", "quantity_on_hand": 8, "reorder_point": 3, "cost_per_unit": 12.00, "selling_price": 35.00, "manufacturer": "Zoetis"},
        {"name": "IV Fluid LRS 1L", "category": "fluid", "quantity_on_hand": 24, "reorder_point": 10, "cost_per_unit": 3.50, "selling_price": 15.00, "manufacturer": "Braun"},
        {"name": "Surgical Gloves (Box 100)", "category": "surgical_supply", "quantity_on_hand": 6, "reorder_point": 3, "cost_per_unit": 12.00, "selling_price": None, "manufacturer": "Ansell"},
        {"name": "3-0 Monocryl Suture", "category": "surgical_supply", "quantity_on_hand": 3, "reorder_point": 5, "cost_per_unit": 18.00, "selling_price": None, "manufacturer": "Ethicon"},
        {"name": "Otomax 15g", "category": "medication", "quantity_on_hand": 12, "reorder_point": 5, "cost_per_unit": 15.00, "selling_price": 45.00, "manufacturer": "Merck"},
    ]
    for inv in vet_inv:
        await db.vet_inventory.insert_one({
            "id": new_id(), "clinic_id": clinic_id, **inv,
            "sku": None, "unit": "units", "reorder_quantity": 20,
            "markup_percentage": 100, "is_controlled": False, "dea_schedule": None,
            "lot_number": f"L{random.randint(10000, 99999)}",
            "expiry_date": (today + timedelta(days=random.randint(90, 730))).strftime("%Y-%m-%d"),
            "storage_location": None, "primary_supplier": "VetSource",
            "is_active": True, "created_at": now, "updated_at": now,
        })

    return {
        "message": "Vet clinic demo data seeded",
        "email": demo_email, "password": "demo123",
        "clinic_id": clinic_id,
    }
