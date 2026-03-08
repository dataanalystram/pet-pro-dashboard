from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from models import new_id, now_iso
from auth_utils import get_current_user, hash_password
import random

router = APIRouter(prefix="/api/shelter")


def get_db():
    from server import db
    return db


async def _get_shelter_id(current_user, db):
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0})
    if not user or not user.get("shelter_id"):
        raise HTTPException(status_code=404, detail="Shelter not found")
    return user["shelter_id"]


# ═══════════════════════════════════════════════════════════
# SHELTER PROFILE
# ═══════════════════════════════════════════════════════════

@router.post("/onboarding")
async def onboard_shelter(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = new_id()
    now = now_iso()
    doc = {
        "id": shelter_id, "user_id": current_user["sub"],
        "name": data.get("name", "My Shelter"),
        "organization_type": data.get("organization_type", "private_shelter"),
        "mission_statement": None, "description": None, "logo_url": None,
        "email": data.get("email", current_user["email"]),
        "phone": data.get("phone"), "emergency_phone": None,
        "address_line1": data.get("address_line1"), "city": data.get("city"),
        "state": data.get("state"), "postal_code": data.get("postal_code"),
        "country": data.get("country", "IE"),
        "max_capacity_dogs": data.get("max_capacity_dogs", 50),
        "max_capacity_cats": data.get("max_capacity_cats", 50),
        "max_capacity_other": data.get("max_capacity_other", 10),
        "current_count_dogs": 0, "current_count_cats": 0, "current_count_other": 0,
        "adoption_fee_dog": 250, "adoption_fee_cat": 150, "adoption_fee_other": 100,
        "is_active": True, "is_accepting_intake": True,
        "created_at": now, "updated_at": now,
    }
    await db.shelters.insert_one(doc)
    await db.users.update_one(
        {"id": current_user["sub"]},
        {"$set": {"shelter_id": shelter_id, "product_type": "shelter"}}
    )
    doc.pop("_id", None)
    return doc


@router.get("/profile")
async def get_shelter(current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    shelter = await db.shelters.find_one({"id": shelter_id}, {"_id": 0})
    # Update counts
    dog_count = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "species": "dog", "outcome_date": None})
    cat_count = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "species": "cat", "outcome_date": None})
    other_count = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "species": {"$nin": ["dog", "cat"]}, "outcome_date": None})
    shelter["current_count_dogs"] = dog_count
    shelter["current_count_cats"] = cat_count
    shelter["current_count_other"] = other_count
    return shelter


@router.put("/profile")
async def update_shelter(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    await db.shelters.update_one({"id": shelter_id}, {"$set": update})
    shelter = await db.shelters.find_one({"id": shelter_id}, {"_id": 0})
    return shelter


# ═══════════════════════════════════════════════════════════
# ANIMALS
# ═══════════════════════════════════════════════════════════

@router.get("/animals")
async def get_animals(
    species: str = None, status: str = None, location: str = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if species:
        query["species"] = species
    if status:
        query["adoption_status"] = status
    if location:
        query["current_location"] = location
    animals = await db.shelter_animals.find(query, {"_id": 0}).sort("intake_date", -1).to_list(500)
    # Compute days in shelter
    now_dt = datetime.now(timezone.utc)
    for a in animals:
        try:
            intake = datetime.fromisoformat(a.get("intake_date", now_dt.isoformat()).replace("Z", "+00:00"))
            outcome = a.get("outcome_date")
            end = datetime.fromisoformat(outcome.replace("Z", "+00:00")) if outcome else now_dt
            a["days_in_shelter"] = max(0, (end - intake).days)
        except Exception:
            a["days_in_shelter"] = 0
    return animals


@router.post("/animals")
async def create_animal(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()

    # Generate animal ID code
    species_prefix = {"dog": "D", "cat": "C", "rabbit": "R", "bird": "B"}.get(data.get("species", "dog"), "O")
    year = datetime.now(timezone.utc).strftime("%Y")
    count = await db.shelter_animals.count_documents({"shelter_id": shelter_id})
    animal_id_code = f"{species_prefix}-{year}-{count + 1:04d}"

    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "name": data.get("name", "Unknown"),
        "animal_id_code": animal_id_code,
        "species": data.get("species", "dog"),
        "breed": data.get("breed"), "breed_secondary": data.get("breed_secondary"),
        "is_mixed_breed": data.get("is_mixed_breed", False),
        "color": data.get("color"), "markings": data.get("markings"),
        "sex": data.get("sex", "unknown"),
        "date_of_birth": data.get("date_of_birth"),
        "estimated_age_months": data.get("estimated_age_months"),
        "weight_kg": data.get("weight_kg"),
        "size": data.get("size", "medium"),
        "microchip_number": data.get("microchip_number"),
        "intake_date": now,
        "intake_type": data.get("intake_type", "stray"),
        "intake_condition": data.get("intake_condition", "healthy"),
        "intake_notes": data.get("intake_notes"),
        "intake_source": data.get("intake_source"),
        "finder_name": data.get("finder_name"),
        "finder_phone": data.get("finder_phone"),
        "previous_owner_name": data.get("previous_owner_name"),
        "surrender_reason": data.get("surrender_reason"),
        "spay_neuter_status": data.get("spay_neuter_status", "unknown"),
        "vaccination_status": "unknown",
        "current_medical_conditions": data.get("current_medical_conditions", []),
        "current_medications": [],
        "current_location": data.get("current_location", "Kennel A-1"),
        "location_type": data.get("location_type", "kennel"),
        "temperament": data.get("temperament"),
        "energy_level": data.get("energy_level"),
        "good_with_dogs": data.get("good_with_dogs"),
        "good_with_cats": data.get("good_with_cats"),
        "good_with_children": data.get("good_with_children"),
        "house_trained": data.get("house_trained"),
        "behavioral_flags": data.get("behavioral_flags", []),
        "behavioral_notes": data.get("behavioral_notes"),
        "primary_photo_url": None, "photos": [], "video_urls": [],
        "adoption_status": "not_available" if data.get("intake_type") == "stray" else "available",
        "adoption_fee": data.get("adoption_fee"),
        "ideal_home_description": data.get("ideal_home_description"),
        "adoption_requirements": [],
        "outcome_type": None, "outcome_date": None, "outcome_notes": None,
        "is_published": False, "featured": False,
        "created_at": now, "updated_at": now,
    }
    await db.shelter_animals.insert_one(doc)

    # Log activity
    await db.shelter_activity_log.insert_one({
        "id": new_id(), "shelter_id": shelter_id,
        "action_type": "animal_intake",
        "description": f"{doc['name']} ({doc['species']}, {doc['breed'] or 'Unknown breed'}) - {doc['intake_type']}",
        "performed_by": current_user["sub"],
        "animal_id": doc["id"], "metadata": {},
        "created_at": now,
    })

    doc.pop("_id", None)
    return doc


@router.get("/animals/{animal_id}")
async def get_animal(animal_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    animal = await db.shelter_animals.find_one({"id": animal_id, "shelter_id": shelter_id}, {"_id": 0})
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    # Enrich
    animal["medical_records"] = await db.shelter_medical_records.find({"animal_id": animal_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    animal["applications"] = await db.adoption_applications.find({"animal_id": animal_id, "shelter_id": shelter_id}, {"_id": 0}).to_list(50)
    # Days in shelter
    try:
        intake = datetime.fromisoformat(animal.get("intake_date", "").replace("Z", "+00:00"))
        animal["days_in_shelter"] = max(0, (datetime.now(timezone.utc) - intake).days)
    except Exception:
        animal["days_in_shelter"] = 0
    return animal


@router.put("/animals/{animal_id}")
async def update_animal(animal_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    if "outcome_type" in update and update["outcome_type"]:
        update["outcome_date"] = now_iso()
    await db.shelter_animals.update_one({"id": animal_id, "shelter_id": shelter_id}, {"$set": update})
    animal = await db.shelter_animals.find_one({"id": animal_id}, {"_id": 0})

    # Log status changes
    if "adoption_status" in data:
        await db.shelter_activity_log.insert_one({
            "id": new_id(), "shelter_id": shelter_id,
            "action_type": "animal_status_change",
            "description": f"{animal.get('name', 'Unknown')} status changed to {data['adoption_status']}",
            "performed_by": current_user["sub"],
            "animal_id": animal_id, "metadata": {},
            "created_at": now_iso(),
        })

    return animal


# ═══════════════════════════════════════════════════════════
# ADOPTION APPLICATIONS
# ═══════════════════════════════════════════════════════════

@router.get("/applications")
async def get_applications(status: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if status:
        query["status"] = status
    apps = await db.adoption_applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    # Enrich with animal info
    animal_ids = list(set(a.get("animal_id") for a in apps if a.get("animal_id")))
    if animal_ids:
        animals = await db.shelter_animals.find({"id": {"$in": animal_ids}}, {"_id": 0, "id": 1, "name": 1, "species": 1, "breed": 1, "primary_photo_url": 1}).to_list(200)
        amap = {a["id"]: a for a in animals}
        for app in apps:
            animal = amap.get(app.get("animal_id"), {})
            app["animal_name"] = animal.get("name", "")
            app["animal_species"] = animal.get("species", "")
            app["animal_breed"] = animal.get("breed", "")
    return apps


@router.post("/applications")
async def create_application(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "animal_id": data.get("animal_id"),
        "applicant_id": data.get("applicant_id", current_user["sub"]),
        "status": "submitted",
        "status_history": [{"status": "submitted", "date": now, "by": current_user["sub"]}],
        "applicant_name": data.get("applicant_name", ""),
        "applicant_email": data.get("applicant_email", ""),
        "applicant_phone": data.get("applicant_phone", ""),
        "applicant_address": data.get("applicant_address", ""),
        "applicant_city": data.get("applicant_city", ""),
        "applicant_state": data.get("applicant_state", ""),
        "applicant_postal_code": data.get("applicant_postal_code", ""),
        "housing_type": data.get("housing_type"),
        "is_homeowner": data.get("is_homeowner"),
        "has_yard": data.get("has_yard"),
        "yard_fenced": data.get("yard_fenced"),
        "has_children_under_12": data.get("has_children_under_12", False),
        "current_pets": data.get("current_pets", []),
        "pet_experience_level": data.get("pet_experience_level", "some_experience"),
        "reason_for_adopting": data.get("reason_for_adopting"),
        "why_this_animal": data.get("why_this_animal"),
        "current_vet_name": data.get("current_vet_name"),
        "current_vet_clinic": data.get("current_vet_clinic"),
        "current_vet_phone": data.get("current_vet_phone"),
        "priority": "normal",
        "assigned_to": None,
        "score": None,
        "internal_notes": None,
        "created_at": now, "updated_at": now,
    }
    await db.adoption_applications.insert_one(doc)

    # Update animal status
    await db.shelter_animals.update_one(
        {"id": data.get("animal_id")},
        {"$set": {"adoption_status": "pending_application", "updated_at": now}}
    )

    # Log
    await db.shelter_activity_log.insert_one({
        "id": new_id(), "shelter_id": shelter_id,
        "action_type": "application_received",
        "description": f"New adoption application from {doc['applicant_name']}",
        "performed_by": current_user["sub"],
        "animal_id": data.get("animal_id"),
        "application_id": doc["id"],
        "metadata": {}, "created_at": now,
    })

    doc.pop("_id", None)
    return doc


@router.put("/applications/{app_id}")
async def update_application(app_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now

    if "status" in update:
        # Add to status history
        app = await db.adoption_applications.find_one({"id": app_id}, {"_id": 0})
        history = app.get("status_history", [])
        history.append({"status": update["status"], "date": now, "by": current_user["sub"], "notes": data.get("notes")})
        update["status_history"] = history

        if update["status"] == "completed":
            update["adoption_date"] = now
            # Update animal
            await db.shelter_animals.update_one(
                {"id": app.get("animal_id")},
                {"$set": {"adoption_status": "adopted", "outcome_type": "adoption", "outcome_date": now, "updated_at": now}}
            )

    await db.adoption_applications.update_one({"id": app_id, "shelter_id": shelter_id}, {"$set": update})
    result = await db.adoption_applications.find_one({"id": app_id}, {"_id": 0})
    return result


# ═══════════════════════════════════════════════════════════
# VOLUNTEERS
# ═══════════════════════════════════════════════════════════

@router.get("/volunteers")
async def get_volunteers(current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    volunteers = await db.shelter_volunteers.find({"shelter_id": shelter_id}, {"_id": 0}).to_list(200)
    return volunteers


@router.post("/volunteers")
async def create_volunteer(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "full_name": data.get("full_name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone"),
        "avatar_url": None,
        "application_status": "pending",
        "background_check_status": "not_started",
        "volunteer_type": data.get("volunteer_type", []),
        "skills": data.get("skills", []),
        "animal_preferences": data.get("animal_preferences", ["dog", "cat"]),
        "can_handle_large_dogs": data.get("can_handle_large_dogs", False),
        "availability": data.get("availability", {}),
        "total_hours_logged": 0, "hours_this_month": 0,
        "total_shifts_completed": 0, "no_show_count": 0,
        "reliability_score": 1.0,
        "volunteer_level": "new",
        "is_foster": data.get("is_foster", False),
        "foster_capacity": data.get("foster_capacity", 0),
        "is_active": True,
        "created_at": now, "updated_at": now,
    }
    await db.shelter_volunteers.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/volunteers/{vol_id}")
async def update_volunteer(vol_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    await db.shelter_volunteers.update_one({"id": vol_id, "shelter_id": shelter_id}, {"$set": update})
    vol = await db.shelter_volunteers.find_one({"id": vol_id}, {"_id": 0})
    return vol


# ═══════════════════════════════════════════════════════════
# DAILY TASKS
# ═══════════════════════════════════════════════════════════

@router.get("/tasks")
async def get_tasks(task_date: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if task_date:
        query["task_date"] = task_date
    else:
        query["task_date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    tasks = await db.shelter_daily_tasks.find(query, {"_id": 0}).sort("priority", -1).to_list(200)
    return tasks


@router.post("/tasks")
async def create_task(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "task_name": data.get("task_name", ""),
        "category": data.get("category", "animal_care"),
        "description": data.get("description"),
        "priority": data.get("priority", "normal"),
        "task_date": data.get("task_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "due_time": data.get("due_time"),
        "assigned_to": data.get("assigned_to"),
        "area": data.get("area"),
        "animal_id": data.get("animal_id"),
        "status": "pending",
        "completed_at": None, "completed_by": None,
        "completion_notes": None,
        "created_at": now,
    }
    await db.shelter_daily_tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    if update.get("status") == "completed":
        update["completed_at"] = now_iso()
        update["completed_by"] = current_user["sub"]
    await db.shelter_daily_tasks.update_one({"id": task_id, "shelter_id": shelter_id}, {"$set": update})
    task = await db.shelter_daily_tasks.find_one({"id": task_id}, {"_id": 0})
    return task


# ═══════════════════════════════════════════════════════════
# MEDICAL RECORDS
# ═══════════════════════════════════════════════════════════

@router.get("/medical")
async def get_medical(animal_id: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if animal_id:
        query["animal_id"] = animal_id
    records = await db.shelter_medical_records.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return records


@router.post("/medical")
async def create_medical(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "animal_id": data.get("animal_id"),
        "record_type": data.get("record_type", "treatment"),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "diagnosis": data.get("diagnosis"),
        "treatment_plan": data.get("treatment_plan"),
        "vaccine_name": data.get("vaccine_name"),
        "vaccine_manufacturer": data.get("vaccine_manufacturer"),
        "vaccine_lot_number": data.get("vaccine_lot_number"),
        "next_due_date": data.get("next_due_date"),
        "medication_name": data.get("medication_name"),
        "medication_dose": data.get("medication_dose"),
        "medication_frequency": data.get("medication_frequency"),
        "veterinarian_name": data.get("veterinarian_name"),
        "status": "completed",
        "completed_date": now,
        "cost": data.get("cost", 0),
        "follow_up_required": data.get("follow_up_required", False),
        "follow_up_date": data.get("follow_up_date"),
        "created_at": now, "updated_at": now,
    }
    await db.shelter_medical_records.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# DONATIONS
# ═══════════════════════════════════════════════════════════

@router.get("/donations")
async def get_donations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    donations = await db.shelter_donations.find({"shelter_id": shelter_id}, {"_id": 0}).sort("donation_date", -1).to_list(200)
    return donations


@router.post("/donations")
async def create_donation(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "donor_name": data.get("donor_name", ""),
        "donor_email": data.get("donor_email"),
        "donor_phone": data.get("donor_phone"),
        "is_anonymous": data.get("is_anonymous", False),
        "donor_type": data.get("donor_type", "individual"),
        "amount": data.get("amount", 0),
        "donation_type": data.get("donation_type", "one_time"),
        "payment_method": data.get("payment_method", "credit_card"),
        "payment_status": "completed",
        "designated_fund": data.get("designated_fund"),
        "designated_animal_id": data.get("designated_animal_id"),
        "is_tax_deductible": True,
        "receipt_sent": False, "thank_you_sent": False,
        "notes": data.get("notes"),
        "donation_date": now,
        "created_at": now,
    }
    await db.shelter_donations.insert_one(doc)

    # Log
    await db.shelter_activity_log.insert_one({
        "id": new_id(), "shelter_id": shelter_id,
        "action_type": "donation_received",
        "description": f"Donation of EUR {data.get('amount', 0):.2f} from {data.get('donor_name', 'Anonymous')}",
        "performed_by": current_user["sub"],
        "metadata": {}, "created_at": now,
    })

    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# ACTIVITY LOG
# ═══════════════════════════════════════════════════════════

@router.get("/activity")
async def get_activity(limit: int = 50, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    activities = await db.shelter_activity_log.find({"shelter_id": shelter_id}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return activities


# ═══════════════════════════════════════════════════════════
# CAMPAIGNS
# ═══════════════════════════════════════════════════════════

@router.get("/campaigns")
async def get_campaigns(current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    campaigns = await db.shelter_campaigns.find({"shelter_id": shelter_id}, {"_id": 0}).to_list(50)
    return campaigns


@router.post("/campaigns")
async def create_campaign(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    doc = {
        "id": new_id(), "shelter_id": shelter_id,
        "name": data.get("name", ""),
        "description": data.get("description"),
        "type": data.get("type", "general"),
        "goal_amount": data.get("goal_amount"),
        "current_amount": 0, "donor_count": 0,
        "start_date": data.get("start_date"),
        "end_date": data.get("end_date"),
        "story": data.get("story"),
        "is_active": True, "is_published": False,
        "created_at": now, "updated_at": now,
    }
    await db.shelter_campaigns.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# DASHBOARD STATS
# ═══════════════════════════════════════════════════════════

@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now_dt = datetime.now(timezone.utc)
    month_start = now_dt.replace(day=1).isoformat()

    shelter = await db.shelters.find_one({"id": shelter_id}, {"_id": 0})

    # Animal counts
    total_in_care = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "outcome_date": None})
    dogs = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "species": "dog", "outcome_date": None})
    cats = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "species": "cat", "outcome_date": None})
    available = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "adoption_status": "available", "outcome_date": None})

    # Status counts
    status_pipeline = [
        {"$match": {"shelter_id": shelter_id, "outcome_date": None}},
        {"$group": {"_id": "$adoption_status", "count": {"$sum": 1}}},
    ]
    status_result = await db.shelter_animals.aggregate(status_pipeline).to_list(20)
    status_counts = {s["_id"]: s["count"] for s in status_result}

    # Applications
    pending_apps = await db.adoption_applications.count_documents({"shelter_id": shelter_id, "status": {"$in": ["submitted", "under_review"]}})
    total_apps = await db.adoption_applications.count_documents({"shelter_id": shelter_id})

    # Month outcomes
    month_adoptions = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "outcome_type": "adoption", "outcome_date": {"$gte": month_start}})
    month_intakes = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "intake_date": {"$gte": month_start}})

    # Donations this month
    month_donations = await db.shelter_donations.find({"shelter_id": shelter_id, "donation_date": {"$gte": month_start}}, {"_id": 0, "amount": 1}).to_list(500)
    total_donations = sum(d.get("amount", 0) for d in month_donations)

    # Today tasks
    today_tasks = await db.shelter_daily_tasks.find({"shelter_id": shelter_id, "task_date": today}, {"_id": 0}).to_list(100)
    tasks_completed = sum(1 for t in today_tasks if t.get("status") == "completed")

    # Volunteers today
    today_volunteers = await db.shelter_volunteers.count_documents({"shelter_id": shelter_id, "is_active": True, "application_status": "approved"})

    # Recent activity
    recent_activity = await db.shelter_activity_log.find({"shelter_id": shelter_id}, {"_id": 0}).sort("created_at", -1).to_list(10)

    return {
        "total_in_care": total_in_care,
        "dogs": dogs, "cats": cats,
        "available_for_adoption": available,
        "status_counts": status_counts,
        "max_capacity_dogs": shelter.get("max_capacity_dogs", 50),
        "max_capacity_cats": shelter.get("max_capacity_cats", 50),
        "pending_applications": pending_apps,
        "total_applications": total_apps,
        "month_adoptions": month_adoptions,
        "month_intakes": month_intakes,
        "month_donations": total_donations,
        "today_tasks": today_tasks,
        "tasks_total": len(today_tasks),
        "tasks_completed": tasks_completed,
        "active_volunteers": today_volunteers,
        "recent_activity": recent_activity,
    }



# ═══════════════════════════════════════════════════════════
# PEOPLE / CRM
# ═══════════════════════════════════════════════════════════

@router.get("/people")
async def get_people(tag: str = None, search: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if tag:
        query["tags"] = tag
    if search:
        query["$or"] = [
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    people = await db.shelter_people.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return people


@router.post("/people")
async def create_person(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "full_name": data.get("full_name", ""),
        "first_name": data.get("first_name", ""),
        "last_name": data.get("last_name", ""),
        "email": data.get("email", ""),
        "phone": data.get("phone", ""),
        "address": data.get("address", ""),
        "city": data.get("city", ""),
        "state": data.get("state", ""),
        "zip_code": data.get("zip_code", ""),
        "tags": data.get("tags", []),
        "notes": data.get("notes", ""),
        "preferred_contact": data.get("preferred_contact", "email"),
        "adoption_history": [],
        "foster_history": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shelter_people.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/people/{person_id}")
async def update_person(person_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    data.pop("id", None)
    data.pop("shelter_id", None)
    await db.shelter_people.update_one(
        {"id": person_id, "shelter_id": shelter_id},
        {"$set": data}
    )
    doc = await db.shelter_people.find_one({"id": person_id}, {"_id": 0})
    return doc


@router.delete("/people/{person_id}")
async def delete_person(person_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_people.delete_one({"id": person_id, "shelter_id": shelter_id})
    return {"status": "deleted"}


@router.get("/people/{person_id}/history")
async def get_person_history(person_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    person = await db.shelter_people.find_one({"id": person_id, "shelter_id": shelter_id}, {"_id": 0})
    if not person:
        raise HTTPException(status_code=404, detail="Person not found")
    
    history = []
    # Check adoption history from stored field
    if person.get("adoption_history"):
        for h in person["adoption_history"]:
            history.append({
                "type": "Adoption",
                "animal_name": h.get("animal_name", "Unknown"),
                "species": h.get("species", "dog"),
                "date": h.get("date"),
            })
    if person.get("foster_history"):
        for h in person["foster_history"]:
            history.append({
                "type": "Foster",
                "animal_name": h.get("animal_name", "Unknown"),
                "species": h.get("species", "dog"),
                "date": h.get("date"),
            })
    
    # Also check for any adoptions linked by email
    if person.get("email"):
        adopted_animals = await db.shelter_animals.find({
            "shelter_id": shelter_id,
            "outcome_type": "adoption",
            "$or": [
                {"adopter_email": person["email"]},
                {"adopter_name": person.get("full_name")},
            ]
        }, {"_id": 0, "name": 1, "species": 1, "outcome_date": 1}).to_list(50)
        
        for a in adopted_animals:
            if not any(h.get("animal_name") == a.get("name") for h in history):
                history.append({
                    "type": "Adoption",
                    "animal_name": a.get("name", "Unknown"),
                    "species": a.get("species", "dog"),
                    "date": a.get("outcome_date"),
                })
    
    # Sort by date descending
    history.sort(key=lambda x: x.get("date") or "", reverse=True)
    return history


# ═══════════════════════════════════════════════════════════
# PARTNERS
# ═══════════════════════════════════════════════════════════

@router.get("/partners")
async def get_partners(partner_type: str = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if partner_type:
        query["partner_types"] = partner_type
    partners = await db.shelter_partners.find(query, {"_id": 0}).sort("name", 1).to_list(200)
    return partners


@router.post("/partners")
async def create_partner(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "name": data.get("name", ""),
        "partner_type": data.get("partner_type", "other"),
        "partner_types": data.get("partner_types", []),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "address": data.get("address", ""),
        "city": data.get("city", ""),
        "state": data.get("state", ""),
        "zip_code": data.get("zip_code", ""),
        "website": data.get("website", ""),
        "contact_name": data.get("contact_name", ""),
        "contact_phone": data.get("contact_phone", ""),
        "contact_email": data.get("contact_email", ""),
        "services": data.get("services", ""),
        "notes": data.get("notes", ""),
        "is_preferred": data.get("is_preferred", False),
        "logo_url": data.get("logo_url", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shelter_partners.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/partners/{partner_id}")
async def update_partner(partner_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    data.pop("id", None)
    data.pop("shelter_id", None)
    await db.shelter_partners.update_one(
        {"id": partner_id, "shelter_id": shelter_id},
        {"$set": data}
    )
    doc = await db.shelter_partners.find_one({"id": partner_id}, {"_id": 0})
    return doc


@router.delete("/partners/{partner_id}")
async def delete_partner(partner_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_partners.delete_one({"id": partner_id, "shelter_id": shelter_id})
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════
# ANIMAL NOTES & FILES
# ═══════════════════════════════════════════════════════════

@router.get("/animals/{animal_id}/notes")
async def get_animal_notes(animal_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    notes = await db.shelter_animal_notes.find(
        {"animal_id": animal_id, "shelter_id": shelter_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)
    return notes


@router.post("/animals/{animal_id}/notes")
async def create_animal_note(animal_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    doc = {
        "id": str(uuid4()),
        "animal_id": animal_id,
        "shelter_id": shelter_id,
        "content": data.get("content", ""),
        "author": current_user.get("email", ""),
        "author_name": data.get("author_name", current_user.get("email", "")),
        "note_type": data.get("note_type", "general"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shelter_animal_notes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.delete("/animals/{animal_id}/notes/{note_id}")
async def delete_animal_note(animal_id: str, note_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_animal_notes.delete_one({"id": note_id, "animal_id": animal_id, "shelter_id": shelter_id})
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════
# OUTCOME EVENTS
# ═══════════════════════════════════════════════════════════

@router.post("/animals/{animal_id}/outcome")
async def create_outcome(animal_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    outcome_type = data.get("outcome_type", "adoption")
    outcome_date = data.get("outcome_date", datetime.now(timezone.utc).isoformat())
    adopter_name = data.get("adopter_name", "")

    # Update the animal
    update = {
        "outcome_type": outcome_type,
        "outcome_date": outcome_date,
        "adopter_name": adopter_name,
        "adoption_status": "adopted" if outcome_type == "adoption" else outcome_type,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shelter_animals.update_one(
        {"id": animal_id, "shelter_id": shelter_id},
        {"$set": update}
    )

    # Log activity
    animal = await db.shelter_animals.find_one({"id": animal_id}, {"_id": 0, "name": 1})
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "activity_type": "adoption" if outcome_type == "adoption" else "transfer",
        "description": f"{animal.get('name', 'Animal')} - {outcome_type} to {adopter_name}",
        "performed_by": current_user.get("email", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"status": "outcome_recorded", "outcome_type": outcome_type}


# ═══════════════════════════════════════════════════════════
# REPORTS DATA
# ═══════════════════════════════════════════════════════════

@router.get("/reports/intake-by-month")
async def report_intake_by_month(year: int = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    if not year:
        year = datetime.now(timezone.utc).year

    pipeline = [
        {"$match": {"shelter_id": shelter_id, "intake_date": {"$regex": f"^{year}"}}},
        {"$group": {
            "_id": {"month": {"$substr": ["$intake_date", 5, 2]}, "species": "$species"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.month": 1}}
    ]
    results = await db.shelter_animals.aggregate(pipeline).to_list(100)

    months = {}
    for r in results:
        m = int(r["_id"]["month"])
        sp = r["_id"].get("species", "other") or "other"
        if m not in months:
            months[m] = {"month": m, "dog": 0, "cat": 0, "other": 0, "total": 0}
        key = sp.lower() if sp.lower() in ["dog", "cat"] else "other"
        months[m][key] += r["count"]
        months[m]["total"] += r["count"]

    return [months.get(m, {"month": m, "dog": 0, "cat": 0, "other": 0, "total": 0}) for m in range(1, 13)]


@router.get("/reports/outcome-by-month")
async def report_outcome_by_month(year: int = None, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    if not year:
        year = datetime.now(timezone.utc).year

    pipeline = [
        {"$match": {"shelter_id": shelter_id, "outcome_date": {"$regex": f"^{year}"}}},
        {"$group": {
            "_id": {"month": {"$substr": ["$outcome_date", 5, 2]}, "outcome_type": "$outcome_type"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.month": 1}}
    ]
    results = await db.shelter_animals.aggregate(pipeline).to_list(100)

    months = {}
    for r in results:
        m = int(r["_id"]["month"])
        ot = r["_id"].get("outcome_type", "other") or "other"
        if m not in months:
            months[m] = {"month": m, "adoption": 0, "transfer": 0, "return_to_owner": 0, "euthanasia": 0, "other": 0, "total": 0}
        key = ot if ot in ["adoption", "transfer", "return_to_owner", "euthanasia"] else "other"
        months[m][key] += r["count"]
        months[m]["total"] += r["count"]

    return [months.get(m, {"month": m, "adoption": 0, "transfer": 0, "return_to_owner": 0, "euthanasia": 0, "other": 0, "total": 0}) for m in range(1, 13)]


# ═══════════════════════════════════════════════════════════
# MEDICAL REMINDERS
# ═══════════════════════════════════════════════════════════

@router.get("/medical-reminders")
async def get_medical_reminders(current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    reminders = await db.shelter_medical_reminders.find(
        {"shelter_id": shelter_id}, {"_id": 0}
    ).sort("next_due_date", 1).to_list(200)
    return reminders


@router.post("/medical-reminders")
async def create_medical_reminder(data: dict, current_user: dict = Depends(get_current_user)):
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "animal_id": data.get("animal_id", ""),
        "animal_name": data.get("animal_name", ""),
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "remind_to": data.get("remind_to", []),
        "frequency": data.get("frequency", "once"),
        "next_due_date": data.get("next_due_date", ""),
        "notify_email": data.get("notify_email", True),
        "notify_sms": data.get("notify_sms", False),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.shelter_medical_reminders.insert_one(doc)
    doc.pop("_id", None)
    return doc



# ═══════════════════════════════════════════════════════════
# SEED DATA
# ═══════════════════════════════════════════════════════════

@router.post("/seed")
async def seed_shelter_data():
    db = get_db()
    demo_email = "shelter@pawparadise.com"
    existing = await db.users.find_one({"email": demo_email}, {"_id": 0})
    if existing:
        return {"message": "Shelter demo data exists", "email": demo_email, "password": "demo123"}

    user_id = new_id()
    shelter_id = new_id()
    now = now_iso()
    today = datetime.now(timezone.utc)

    # User
    await db.users.insert_one({
        "id": user_id, "email": demo_email,
        "password_hash": hash_password("demo123"),
        "full_name": "Maria Fitzgerald",
        "role": "shelter", "product_type": "shelter",
        "avatar_url": None, "shelter_id": shelter_id,
        "created_at": now, "updated_at": now,
    })

    # Shelter
    await db.shelters.insert_one({
        "id": shelter_id, "user_id": user_id,
        "name": "Dublin Animal Rescue",
        "organization_type": "private_shelter",
        "mission_statement": "Saving lives, one paw at a time.",
        "description": "Dublin's premier no-kill animal shelter providing rescue, rehabilitation, and rehoming services.",
        "email": demo_email, "phone": "+353 1 555 0200",
        "emergency_phone": "+353 1 555 0299",
        "address_line1": "45 Phoenix Park Gate", "city": "Dublin", "state": "Dublin",
        "postal_code": "D08 X2A9", "country": "IE",
        "max_capacity_dogs": 60, "max_capacity_cats": 40, "max_capacity_other": 15,
        "current_count_dogs": 0, "current_count_cats": 0, "current_count_other": 0,
        "adoption_fee_dog": 250, "adoption_fee_cat": 150, "adoption_fee_other": 100,
        "adoption_policy": "All adoptions require an approved application, home check, and signed contract.",
        "is_active": True, "is_accepting_intake": True,
        "created_at": now, "updated_at": now,
    })

    # Animals
    dogs = [
        {"name": "Rocky", "breed": "Staffordshire Bull Terrier", "color": "Brindle", "sex": "male", "age_months": 36, "weight_kg": 18.5, "size": "medium", "intake_type": "stray", "temperament": "Friendly, energetic", "energy_level": "high", "good_with_dogs": True, "good_with_cats": False, "good_with_children": True, "location": "Kennel A-1", "status": "available"},
        {"name": "Daisy", "breed": "Labrador Mix", "color": "Black", "sex": "female", "age_months": 24, "weight_kg": 22.0, "size": "large", "intake_type": "owner_surrender", "temperament": "Gentle, calm", "energy_level": "moderate", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "location": "Kennel A-3", "status": "available"},
        {"name": "Duke", "breed": "German Shepherd", "color": "Black and Tan", "sex": "male", "age_months": 60, "weight_kg": 35.0, "size": "large", "intake_type": "confiscation", "temperament": "Loyal, protective", "energy_level": "high", "good_with_dogs": False, "good_with_cats": False, "good_with_children": False, "location": "Kennel B-1", "status": "hold_behavioral"},
        {"name": "Rosie", "breed": "Cockapoo", "color": "Apricot", "sex": "female", "age_months": 12, "weight_kg": 7.5, "size": "small", "intake_type": "owner_surrender", "temperament": "Playful, social", "energy_level": "high", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "location": "Kennel A-5", "status": "pending_application"},
        {"name": "Bruno", "breed": "Boxer", "color": "Fawn", "sex": "male", "age_months": 48, "weight_kg": 29.0, "size": "large", "intake_type": "transfer_in", "temperament": "Goofy, affectionate", "energy_level": "high", "good_with_dogs": True, "good_with_cats": None, "good_with_children": True, "location": "Kennel B-3", "status": "available"},
        {"name": "Penny", "breed": "Jack Russell Terrier", "color": "White and Brown", "sex": "female", "age_months": 84, "weight_kg": 6.5, "size": "small", "intake_type": "stray", "temperament": "Independent, spirited", "energy_level": "high", "good_with_dogs": True, "good_with_cats": False, "good_with_children": False, "location": "Kennel A-7", "status": "available"},
        {"name": "Buddy", "breed": "Golden Retriever", "color": "Golden", "sex": "male", "age_months": 18, "weight_kg": 28.0, "size": "large", "intake_type": "stray", "temperament": "Friendly, eager to please", "energy_level": "moderate", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "location": "Foster Home", "status": "foster"},
        {"name": "Sasha", "breed": "Husky Mix", "color": "Grey and White", "sex": "female", "age_months": 30, "weight_kg": 20.0, "size": "medium", "intake_type": "owner_surrender", "temperament": "Vocal, active", "energy_level": "very_high", "good_with_dogs": True, "good_with_cats": False, "good_with_children": True, "location": "Kennel C-1", "status": "available"},
    ]
    cats = [
        {"name": "Mittens", "breed": "Domestic Shorthair", "color": "Tuxedo", "sex": "female", "age_months": 36, "weight_kg": 4.0, "size": "medium", "intake_type": "stray", "temperament": "Shy, gentle", "energy_level": "low", "location": "Cat Room 1", "status": "available"},
        {"name": "Oliver", "breed": "Tabby", "color": "Orange", "sex": "male", "age_months": 12, "weight_kg": 3.5, "size": "medium", "intake_type": "stray", "temperament": "Playful, curious", "energy_level": "high", "location": "Cat Room 1", "status": "available"},
        {"name": "Shadow", "breed": "Domestic Longhair", "color": "Black", "sex": "male", "age_months": 60, "weight_kg": 5.0, "size": "medium", "intake_type": "owner_surrender", "temperament": "Calm, independent", "energy_level": "low", "location": "Cat Room 2", "status": "available"},
        {"name": "Luna", "breed": "Siamese Mix", "color": "Seal Point", "sex": "female", "age_months": 8, "weight_kg": 2.8, "size": "small", "intake_type": "born_in_shelter", "temperament": "Vocal, affectionate", "energy_level": "moderate", "location": "Cat Room 1", "status": "available"},
        {"name": "Ginger", "breed": "Persian Mix", "color": "Orange", "sex": "female", "age_months": 96, "weight_kg": 3.2, "size": "small", "intake_type": "owner_surrender", "temperament": "Gentle, lap cat", "energy_level": "low", "location": "Cat Room 2", "status": "hold_medical"},
        {"name": "Felix", "breed": "Domestic Shorthair", "color": "Grey Tabby", "sex": "male", "age_months": 4, "weight_kg": 1.8, "size": "small", "intake_type": "field_rescue", "temperament": "Fearful but improving", "energy_level": "moderate", "location": "Quarantine", "status": "hold_medical"},
    ]

    animal_ids = []
    for d in dogs:
        aid = new_id()
        animal_ids.append(aid)
        days_ago = random.randint(3, 120)
        await db.shelter_animals.insert_one({
            "id": aid, "shelter_id": shelter_id,
            "name": d["name"], "animal_id_code": f"D-2025-{len(animal_ids):04d}",
            "species": "dog", "breed": d["breed"], "color": d["color"],
            "sex": d["sex"], "estimated_age_months": d["age_months"],
            "weight_kg": d["weight_kg"], "size": d["size"],
            "microchip_number": f"985{random.randint(100000000, 999999999)}",
            "intake_date": (today - timedelta(days=days_ago)).isoformat(),
            "intake_type": d["intake_type"], "intake_condition": "healthy",
            "spay_neuter_status": random.choice(["neutered", "spayed", "intact"]),
            "vaccination_status": random.choice(["current", "partial", "overdue"]),
            "current_location": d["location"], "location_type": "kennel" if "Kennel" in d["location"] else "foster_home",
            "temperament": d["temperament"], "energy_level": d["energy_level"],
            "good_with_dogs": d["good_with_dogs"], "good_with_cats": d["good_with_cats"],
            "good_with_children": d["good_with_children"], "house_trained": random.choice([True, False, None]),
            "behavioral_flags": [], "behavioral_notes": None,
            "primary_photo_url": None, "photos": [],
            "adoption_status": d["status"],
            "adoption_fee": 250,
            "ideal_home_description": None,
            "outcome_type": None, "outcome_date": None,
            "is_published": d["status"] == "available",
            "featured": d["name"] in ["Daisy", "Buddy"],
            "created_at": (today - timedelta(days=days_ago)).isoformat(),
            "updated_at": now,
        })

    for c in cats:
        aid = new_id()
        animal_ids.append(aid)
        days_ago = random.randint(3, 90)
        await db.shelter_animals.insert_one({
            "id": aid, "shelter_id": shelter_id,
            "name": c["name"], "animal_id_code": f"C-2025-{len(animal_ids):04d}",
            "species": "cat", "breed": c["breed"], "color": c["color"],
            "sex": c["sex"], "estimated_age_months": c["age_months"],
            "weight_kg": c["weight_kg"], "size": c["size"],
            "microchip_number": f"985{random.randint(100000000, 999999999)}",
            "intake_date": (today - timedelta(days=days_ago)).isoformat(),
            "intake_type": c["intake_type"], "intake_condition": "healthy",
            "spay_neuter_status": random.choice(["spayed", "neutered", "intact"]),
            "vaccination_status": random.choice(["current", "partial"]),
            "current_location": c["location"],
            "location_type": "cage" if "Cat Room" in c["location"] else "isolation",
            "temperament": c["temperament"], "energy_level": c["energy_level"],
            "good_with_dogs": random.choice([True, False, None]),
            "good_with_cats": True, "good_with_children": random.choice([True, None]),
            "house_trained": True,
            "behavioral_flags": [], "adoption_status": c["status"],
            "adoption_fee": 150,
            "is_published": c["status"] == "available",
            "featured": c["name"] in ["Luna"],
            "outcome_type": None, "outcome_date": None,
            "created_at": (today - timedelta(days=days_ago)).isoformat(),
            "updated_at": now,
        })

    # Adoption Applications
    app_data = [
        {"applicant_name": "Patrick O'Connor", "applicant_email": "patrick@example.com", "animal_name": "Rosie", "status": "interview_completed", "housing_type": "house", "has_yard": True, "yard_fenced": True, "experience": "experienced"},
        {"applicant_name": "Emma Walsh", "applicant_email": "emma.w@example.com", "animal_name": "Daisy", "status": "submitted", "housing_type": "house", "has_yard": True, "yard_fenced": True, "experience": "some_experience"},
        {"applicant_name": "Sean McCarthy", "applicant_email": "sean.m@example.com", "animal_name": "Rocky", "status": "under_review", "housing_type": "house", "has_yard": True, "yard_fenced": False, "experience": "experienced"},
        {"applicant_name": "Aisling Brennan", "applicant_email": "aisling.b@example.com", "animal_name": "Mittens", "status": "submitted", "housing_type": "apartment", "has_yard": False, "yard_fenced": False, "experience": "first_time"},
        {"applicant_name": "Conor Kelly", "applicant_email": "conor.k@example.com", "animal_name": "Bruno", "status": "home_check_scheduled", "housing_type": "house", "has_yard": True, "yard_fenced": True, "experience": "experienced"},
        {"applicant_name": "Siobhan Doyle", "applicant_email": "siobhan@example.com", "animal_name": "Luna", "status": "approved", "housing_type": "apartment", "has_yard": False, "yard_fenced": False, "experience": "some_experience"},
    ]
    # Find animal IDs by name
    all_animals = await db.shelter_animals.find({"shelter_id": shelter_id}, {"_id": 0, "id": 1, "name": 1}).to_list(100)
    animal_name_map = {a["name"]: a["id"] for a in all_animals}

    for a in app_data:
        days_ago = random.randint(1, 14)
        await db.adoption_applications.insert_one({
            "id": new_id(), "shelter_id": shelter_id,
            "animal_id": animal_name_map.get(a["animal_name"], animal_ids[0]),
            "applicant_id": user_id,
            "status": a["status"],
            "status_history": [{"status": "submitted", "date": (today - timedelta(days=days_ago)).isoformat(), "by": user_id}],
            "applicant_name": a["applicant_name"],
            "applicant_email": a["applicant_email"],
            "applicant_phone": f"+353 {random.randint(85, 89)} {random.randint(100, 999)} {random.randint(1000, 9999)}",
            "applicant_address": f"{random.randint(1, 200)} {random.choice(['Oak', 'Elm', 'Cedar', 'Willow'])} Street",
            "applicant_city": random.choice(["Dublin", "Bray", "Dun Laoghaire", "Blackrock"]),
            "applicant_state": "Dublin",
            "applicant_postal_code": f"D{random.randint(1, 24):02d}",
            "housing_type": a["housing_type"],
            "is_homeowner": random.choice([True, False]),
            "has_yard": a["has_yard"],
            "yard_fenced": a["yard_fenced"],
            "has_children_under_12": random.choice([True, False]),
            "current_pets": [],
            "pet_experience_level": a["experience"],
            "reason_for_adopting": "Looking for a companion",
            "why_this_animal": f"Fell in love with {a['animal_name']} at first sight",
            "priority": "normal",
            "assigned_to": None, "score": None,
            "internal_notes": None,
            "created_at": (today - timedelta(days=days_ago)).isoformat(),
            "updated_at": now,
        })

    # Volunteers
    vol_data = [
        {"full_name": "Ciara Murphy", "email": "ciara.v@example.com", "types": ["dog_walking", "cleaning"], "status": "approved", "hours": 45, "level": "silver"},
        {"full_name": "Ryan O'Brien", "email": "ryan.v@example.com", "types": ["dog_walking", "events"], "status": "approved", "hours": 120, "level": "gold"},
        {"full_name": "Niamh Flynn", "email": "niamh.v@example.com", "types": ["cat_socialization", "photography"], "status": "approved", "hours": 28, "level": "bronze"},
        {"full_name": "Declan Walsh", "email": "declan.v@example.com", "types": ["dog_walking", "transport"], "status": "approved", "hours": 200, "level": "gold", "is_foster": True, "foster_cap": 2},
        {"full_name": "Grace Kelly", "email": "grace.v@example.com", "types": ["admin", "events"], "status": "pending", "hours": 0, "level": "new"},
    ]
    for v in vol_data:
        await db.shelter_volunteers.insert_one({
            "id": new_id(), "shelter_id": shelter_id,
            "full_name": v["full_name"], "email": v["email"], "phone": None, "avatar_url": None,
            "application_status": v["status"],
            "background_check_status": "passed" if v["status"] == "approved" else "not_started",
            "volunteer_type": v["types"],
            "skills": [], "animal_preferences": ["dog", "cat"],
            "can_handle_large_dogs": "dog_walking" in v["types"],
            "availability": {}, "total_hours_logged": v["hours"],
            "hours_this_month": min(v["hours"], 20),
            "total_shifts_completed": v["hours"] // 4,
            "no_show_count": 0, "reliability_score": round(random.uniform(0.85, 1.0), 2),
            "volunteer_level": v["level"],
            "is_foster": v.get("is_foster", False),
            "foster_capacity": v.get("foster_cap", 0),
            "is_active": True, "created_at": now, "updated_at": now,
        })

    # Daily tasks
    today_str = today.strftime("%Y-%m-%d")
    tasks = [
        {"task_name": "Morning feeding - Dogs", "category": "feeding", "priority": "high", "due_time": "07:00", "area": "Dog Ward", "status": "completed"},
        {"task_name": "Morning feeding - Cats", "category": "feeding", "priority": "high", "due_time": "07:30", "area": "Cat Rooms", "status": "completed"},
        {"task_name": "Kennel cleaning - Ward A", "category": "cleaning", "priority": "high", "due_time": "08:00", "area": "Ward A", "status": "completed"},
        {"task_name": "Kennel cleaning - Ward B", "category": "cleaning", "priority": "high", "due_time": "08:30", "area": "Ward B", "status": "in_progress"},
        {"task_name": "Cat room cleaning", "category": "cleaning", "priority": "high", "due_time": "09:00", "area": "Cat Rooms", "status": "pending"},
        {"task_name": "Dog walking rounds - AM", "category": "animal_care", "priority": "normal", "due_time": "09:30", "area": "Exercise Yard", "status": "pending"},
        {"task_name": "Medication rounds - AM", "category": "medical", "priority": "critical", "due_time": "08:00", "area": "All", "status": "completed"},
        {"task_name": "Safety walkthrough", "category": "safety_check", "priority": "high", "due_time": "09:00", "area": "Entire Facility", "status": "pending"},
        {"task_name": "Evening feeding - Dogs", "category": "feeding", "priority": "high", "due_time": "17:00", "area": "Dog Ward", "status": "pending"},
        {"task_name": "Evening feeding - Cats", "category": "feeding", "priority": "high", "due_time": "17:30", "area": "Cat Rooms", "status": "pending"},
        {"task_name": "Medication rounds - PM", "category": "medical", "priority": "critical", "due_time": "17:00", "area": "All", "status": "pending"},
        {"task_name": "Laundry", "category": "cleaning", "priority": "normal", "due_time": "10:00", "area": "Utility", "status": "pending"},
    ]
    for t in tasks:
        await db.shelter_daily_tasks.insert_one({
            "id": new_id(), "shelter_id": shelter_id,
            **t, "task_date": today_str,
            "description": None, "assigned_to": None,
            "animal_id": None,
            "completed_at": now if t["status"] == "completed" else None,
            "completed_by": user_id if t["status"] == "completed" else None,
            "completion_notes": None,
            "created_at": now,
        })

    # Donations
    for i in range(15):
        days_ago = random.randint(0, 60)
        await db.shelter_donations.insert_one({
            "id": new_id(), "shelter_id": shelter_id,
            "donor_name": random.choice(["John Smith", "Mary Johnson", "Anonymous", "Pet Lovers Foundation", "Dublin Corp Matching", "Sarah Williams"]),
            "donor_email": f"donor{i}@example.com",
            "is_anonymous": random.random() < 0.2,
            "donor_type": random.choice(["individual", "individual", "individual", "corporate", "foundation"]),
            "amount": random.choice([25, 50, 50, 100, 100, 150, 250, 500, 1000]),
            "donation_type": random.choice(["one_time", "one_time", "recurring"]),
            "payment_method": "credit_card",
            "payment_status": "completed",
            "is_tax_deductible": True,
            "receipt_sent": random.choice([True, False]),
            "thank_you_sent": random.choice([True, False]),
            "donation_date": (today - timedelta(days=days_ago)).isoformat(),
            "created_at": (today - timedelta(days=days_ago)).isoformat(),
        })

    # Activity log
    activities = [
        {"type": "animal_intake", "desc": "Rocky (Staffordshire Bull Terrier) - Stray intake"},
        {"type": "application_received", "desc": "New adoption application from Patrick O'Connor for Rosie"},
        {"type": "donation_received", "desc": "Donation of EUR 500.00 from Pet Lovers Foundation"},
        {"type": "animal_status_change", "desc": "Daisy status changed to available"},
        {"type": "volunteer_shift_completed", "desc": "Ryan O'Brien completed 4hr dog walking shift"},
        {"type": "medical_record_added", "desc": "Vaccination administered to Luna (FVRCP)"},
        {"type": "task_completed", "desc": "Morning feeding - Dogs completed"},
        {"type": "application_status_change", "desc": "Patrick O'Connor application moved to interview_completed"},
    ]
    for i, act in enumerate(activities):
        await db.shelter_activity_log.insert_one({
            "id": new_id(), "shelter_id": shelter_id,
            "action_type": act["type"],
            "description": act["desc"],
            "performed_by": user_id,
            "metadata": {},
            "created_at": (today - timedelta(hours=i * 3)).isoformat(),
        })

    return {
        "message": "Shelter demo data seeded",
        "email": demo_email, "password": "demo123",
        "shelter_id": shelter_id,
    }
