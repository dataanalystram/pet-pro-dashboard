"""
Extended Shelter Routes - Comprehensive Features
- File/Photo Upload
- Foster Management
- Kennel/Location Management
- Lost & Found
- Volunteer Shifts
- Notifications
- E-Contracts
- Public Portal
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from models import new_id, now_iso
from auth_utils import get_current_user
import base64
import os

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
# FILE/PHOTO UPLOAD
# ═══════════════════════════════════════════════════════════

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    file_type: str = Form(default="photo"),
    current_user: dict = Depends(get_current_user)
):
    """Upload photos/documents for animals, people, contracts, etc."""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    
    # Read file content and encode as base64
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    
    file_id = str(uuid4())
    now = now_iso()
    
    # Store file metadata and content
    file_doc = {
        "id": file_id,
        "shelter_id": shelter_id,
        "entity_type": entity_type,  # animal, person, contract, etc.
        "entity_id": entity_id,
        "file_type": file_type,  # photo, document, signature, contract
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(content),
        "data": base64.b64encode(content).decode('utf-8'),
        "uploaded_by": current_user["sub"],
        "created_at": now,
    }
    await db.shelter_files.insert_one(file_doc)
    
    # Update entity with file reference
    if entity_type == "animal" and file_type == "photo":
        # Set as primary photo if first photo
        animal = await db.shelter_animals.find_one({"id": entity_id, "shelter_id": shelter_id})
        if animal:
            photos = animal.get("photos", [])
            photos.append(file_id)
            update = {"photos": photos, "updated_at": now}
            if not animal.get("primary_photo_url"):
                update["primary_photo_url"] = file_id
            await db.shelter_animals.update_one({"id": entity_id}, {"$set": update})
    
    return {"id": file_id, "filename": file.filename, "content_type": file.content_type}


@router.get("/files/{file_id}")
async def get_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Get file by ID"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    file_doc = await db.shelter_files.find_one({"id": file_id, "shelter_id": shelter_id}, {"_id": 0})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    return file_doc


@router.get("/files/{file_id}/download")
async def download_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Get file content for download"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    file_doc = await db.shelter_files.find_one({"id": file_id, "shelter_id": shelter_id}, {"_id": 0})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    from fastapi.responses import Response
    content = base64.b64decode(file_doc["data"])
    return Response(
        content=content,
        media_type=file_doc["content_type"],
        headers={"Content-Disposition": f'attachment; filename="{file_doc["filename"]}"'}
    )


@router.delete("/files/{file_id}")
async def delete_file(file_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a file"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_files.delete_one({"id": file_id, "shelter_id": shelter_id})
    return {"status": "deleted"}


@router.get("/entities/{entity_type}/{entity_id}/files")
async def get_entity_files(entity_type: str, entity_id: str, current_user: dict = Depends(get_current_user)):
    """Get all files for an entity"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    files = await db.shelter_files.find(
        {"shelter_id": shelter_id, "entity_type": entity_type, "entity_id": entity_id},
        {"_id": 0, "data": 0}  # Exclude data for listing
    ).to_list(100)
    return files


# ═══════════════════════════════════════════════════════════
# FOSTER MANAGEMENT
# ═══════════════════════════════════════════════════════════

@router.get("/fosters")
async def get_fosters(status: str = None, current_user: dict = Depends(get_current_user)):
    """Get all foster placements"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if status:
        query["status"] = status
    fosters = await db.shelter_fosters.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    
    # Enrich with animal and foster parent info
    for f in fosters:
        if f.get("animal_id"):
            animal = await db.shelter_animals.find_one({"id": f["animal_id"]}, {"_id": 0, "name": 1, "species": 1, "breed": 1, "primary_photo_url": 1})
            f["animal"] = animal
        if f.get("foster_parent_id"):
            parent = await db.shelter_people.find_one({"id": f["foster_parent_id"]}, {"_id": 0, "full_name": 1, "email": 1, "phone": 1})
            if not parent:
                parent = await db.shelter_volunteers.find_one({"id": f["foster_parent_id"]}, {"_id": 0, "full_name": 1, "email": 1, "phone": 1})
            f["foster_parent"] = parent
    return fosters


@router.post("/fosters")
async def create_foster(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new foster placement"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "animal_id": data.get("animal_id"),
        "foster_parent_id": data.get("foster_parent_id"),
        "foster_parent_name": data.get("foster_parent_name", ""),
        "foster_parent_email": data.get("foster_parent_email", ""),
        "foster_parent_phone": data.get("foster_parent_phone", ""),
        "start_date": data.get("start_date", now),
        "expected_end_date": data.get("expected_end_date"),
        "actual_end_date": None,
        "status": "active",
        "foster_type": data.get("foster_type", "standard"),  # standard, medical, behavioral, maternity
        "supplies_provided": data.get("supplies_provided", []),
        "special_instructions": data.get("special_instructions", ""),
        "feeding_schedule": data.get("feeding_schedule", ""),
        "medication_instructions": data.get("medication_instructions", ""),
        "vet_contact": data.get("vet_contact", ""),
        "emergency_protocol": data.get("emergency_protocol", ""),
        "check_in_frequency": data.get("check_in_frequency", "weekly"),
        "notes": [],
        "created_at": now,
        "updated_at": now,
    }
    await db.shelter_fosters.insert_one(doc)
    
    # Update animal location
    if data.get("animal_id"):
        await db.shelter_animals.update_one(
            {"id": data["animal_id"], "shelter_id": shelter_id},
            {"$set": {"current_location": f"Foster: {data.get('foster_parent_name', 'Unknown')}", "adoption_status": "foster", "updated_at": now}}
        )
    
    # Log activity
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "action_type": "foster_placement",
        "description": f"Animal placed in foster care with {data.get('foster_parent_name', 'Unknown')}",
        "performed_by": current_user["sub"],
        "animal_id": data.get("animal_id"),
        "created_at": now,
    })
    
    doc.pop("_id", None)
    return doc


@router.put("/fosters/{foster_id}")
async def update_foster(foster_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update foster placement"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now
    
    # If ending foster
    if update.get("status") == "completed":
        update["actual_end_date"] = now
        foster = await db.shelter_fosters.find_one({"id": foster_id})
        if foster and foster.get("animal_id"):
            await db.shelter_animals.update_one(
                {"id": foster["animal_id"]},
                {"$set": {"current_location": "Returned from foster", "adoption_status": "available", "updated_at": now}}
            )
    
    await db.shelter_fosters.update_one({"id": foster_id, "shelter_id": shelter_id}, {"$set": update})
    result = await db.shelter_fosters.find_one({"id": foster_id}, {"_id": 0})
    return result


@router.post("/fosters/{foster_id}/notes")
async def add_foster_note(foster_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Add a note to foster placement"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    note = {
        "id": str(uuid4()),
        "content": data.get("content", ""),
        "note_type": data.get("note_type", "general"),
        "author": current_user.get("email", ""),
        "created_at": now,
    }
    
    await db.shelter_fosters.update_one(
        {"id": foster_id, "shelter_id": shelter_id},
        {"$push": {"notes": note}, "$set": {"updated_at": now}}
    )
    return note


# ═══════════════════════════════════════════════════════════
# KENNEL/LOCATION MANAGEMENT
# ═══════════════════════════════════════════════════════════

@router.get("/locations")
async def get_locations(current_user: dict = Depends(get_current_user)):
    """Get all kennel/cage locations"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    locations = await db.shelter_locations.find({"shelter_id": shelter_id}, {"_id": 0}).sort("name", 1).to_list(200)
    
    # Get current occupants
    for loc in locations:
        occupants = await db.shelter_animals.find(
            {"shelter_id": shelter_id, "current_location": loc["name"], "outcome_date": None},
            {"_id": 0, "id": 1, "name": 1, "species": 1, "breed": 1, "primary_photo_url": 1}
        ).to_list(10)
        loc["occupants"] = occupants
        loc["current_count"] = len(occupants)
    return locations


@router.post("/locations")
async def create_location(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a new location/kennel"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "name": data.get("name", ""),
        "location_type": data.get("location_type", "kennel"),  # kennel, cage, room, isolation, outdoor
        "building": data.get("building", "Main"),
        "floor": data.get("floor", "1"),
        "section": data.get("section", "A"),
        "capacity": data.get("capacity", 1),
        "species_allowed": data.get("species_allowed", ["dog", "cat"]),
        "size_suitable": data.get("size_suitable", ["small", "medium", "large"]),
        "features": data.get("features", []),  # heated, outdoor_access, camera, etc.
        "is_isolation": data.get("is_isolation", False),
        "is_quarantine": data.get("is_quarantine", False),
        "status": "available",
        "notes": data.get("notes", ""),
        "created_at": now,
    }
    await db.shelter_locations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/locations/{location_id}")
async def update_location(location_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update location details"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    await db.shelter_locations.update_one({"id": location_id, "shelter_id": shelter_id}, {"$set": update})
    result = await db.shelter_locations.find_one({"id": location_id}, {"_id": 0})
    return result


@router.delete("/locations/{location_id}")
async def delete_location(location_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a location"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_locations.delete_one({"id": location_id, "shelter_id": shelter_id})
    return {"status": "deleted"}


@router.post("/animals/{animal_id}/move")
async def move_animal(animal_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Move an animal to a new location"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    animal = await db.shelter_animals.find_one({"id": animal_id, "shelter_id": shelter_id})
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    
    old_location = animal.get("current_location", "Unknown")
    new_location = data.get("new_location", "")
    
    # Update animal
    await db.shelter_animals.update_one(
        {"id": animal_id},
        {"$set": {"current_location": new_location, "updated_at": now}}
    )
    
    # Log movement
    movement = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "animal_id": animal_id,
        "from_location": old_location,
        "to_location": new_location,
        "reason": data.get("reason", ""),
        "moved_by": current_user["sub"],
        "moved_at": now,
    }
    await db.shelter_movements.insert_one(movement)
    
    # Activity log
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "action_type": "animal_moved",
        "description": f"{animal.get('name', 'Animal')} moved from {old_location} to {new_location}",
        "performed_by": current_user["sub"],
        "animal_id": animal_id,
        "created_at": now,
    })
    
    return {"status": "moved", "from": old_location, "to": new_location}


@router.get("/animals/{animal_id}/movements")
async def get_animal_movements(animal_id: str, current_user: dict = Depends(get_current_user)):
    """Get movement history for an animal"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    movements = await db.shelter_movements.find(
        {"animal_id": animal_id, "shelter_id": shelter_id},
        {"_id": 0}
    ).sort("moved_at", -1).to_list(100)
    return movements


# ═══════════════════════════════════════════════════════════
# LOST & FOUND
# ═══════════════════════════════════════════════════════════

@router.get("/lost-found")
async def get_lost_found(report_type: str = None, status: str = None, current_user: dict = Depends(get_current_user)):
    """Get lost and found reports"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if report_type:
        query["report_type"] = report_type
    if status:
        query["status"] = status
    reports = await db.shelter_lost_found.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)
    return reports


@router.post("/lost-found")
async def create_lost_found(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a lost or found report"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "report_type": data.get("report_type", "found"),  # lost, found
        "status": "active",
        "species": data.get("species", "dog"),
        "breed": data.get("breed", ""),
        "color": data.get("color", ""),
        "size": data.get("size", "medium"),
        "sex": data.get("sex", "unknown"),
        "age_estimate": data.get("age_estimate", ""),
        "name": data.get("name", ""),
        "description": data.get("description", ""),
        "distinguishing_features": data.get("distinguishing_features", ""),
        "microchip_number": data.get("microchip_number", ""),
        "collar_description": data.get("collar_description", ""),
        "last_seen_date": data.get("last_seen_date", now),
        "last_seen_location": data.get("last_seen_location", ""),
        "last_seen_address": data.get("last_seen_address", ""),
        "reporter_name": data.get("reporter_name", ""),
        "reporter_phone": data.get("reporter_phone", ""),
        "reporter_email": data.get("reporter_email", ""),
        "photos": data.get("photos", []),
        "matched_animal_id": None,
        "matched_report_id": None,
        "resolution_notes": None,
        "resolved_at": None,
        "created_at": now,
        "updated_at": now,
    }
    await db.shelter_lost_found.insert_one(doc)
    
    # Activity log
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "action_type": f"{data.get('report_type', 'found')}_report",
        "description": f"New {data.get('report_type', 'found')} report: {data.get('species', 'Unknown')} - {data.get('breed', 'Unknown breed')}",
        "performed_by": current_user["sub"],
        "created_at": now,
    })
    
    doc.pop("_id", None)
    return doc


@router.put("/lost-found/{report_id}")
async def update_lost_found(report_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update a lost/found report"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now
    
    if update.get("status") == "resolved":
        update["resolved_at"] = now
    
    await db.shelter_lost_found.update_one({"id": report_id, "shelter_id": shelter_id}, {"$set": update})
    result = await db.shelter_lost_found.find_one({"id": report_id}, {"_id": 0})
    return result


@router.post("/lost-found/{report_id}/match")
async def match_lost_found(report_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Match a lost/found report to an animal or another report"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    update = {
        "status": "matched",
        "updated_at": now,
    }
    
    if data.get("animal_id"):
        update["matched_animal_id"] = data["animal_id"]
    if data.get("report_id"):
        update["matched_report_id"] = data["report_id"]
    if data.get("notes"):
        update["resolution_notes"] = data["notes"]
    
    await db.shelter_lost_found.update_one({"id": report_id, "shelter_id": shelter_id}, {"$set": update})
    
    # Activity log
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "action_type": "lost_found_matched",
        "description": f"Lost/Found report matched",
        "performed_by": current_user["sub"],
        "created_at": now,
    })
    
    return {"status": "matched"}


# ═══════════════════════════════════════════════════════════
# VOLUNTEER SHIFTS
# ═══════════════════════════════════════════════════════════

@router.get("/shifts")
async def get_shifts(date: str = None, volunteer_id: str = None, current_user: dict = Depends(get_current_user)):
    """Get volunteer shifts"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if date:
        query["shift_date"] = date
    if volunteer_id:
        query["volunteer_id"] = volunteer_id
    shifts = await db.shelter_shifts.find(query, {"_id": 0}).sort("shift_date", -1).to_list(500)
    
    # Enrich with volunteer info
    for s in shifts:
        if s.get("volunteer_id"):
            vol = await db.shelter_volunteers.find_one({"id": s["volunteer_id"]}, {"_id": 0, "full_name": 1, "email": 1, "phone": 1})
            s["volunteer"] = vol
    return shifts


@router.post("/shifts")
async def create_shift(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a volunteer shift"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "volunteer_id": data.get("volunteer_id"),
        "shift_date": data.get("shift_date"),
        "start_time": data.get("start_time"),
        "end_time": data.get("end_time"),
        "shift_type": data.get("shift_type", "general"),  # dog_walking, cat_care, cleaning, admin, events
        "area_assigned": data.get("area_assigned"),
        "status": "scheduled",
        "hours_logged": 0,
        "check_in_time": None,
        "check_out_time": None,
        "tasks_completed": [],
        "notes": data.get("notes", ""),
        "created_at": now,
    }
    await db.shelter_shifts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/shifts/{shift_id}")
async def update_shift(shift_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update a shift"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    
    # Calculate hours if checking out
    if update.get("status") == "completed" and update.get("check_out_time"):
        shift = await db.shelter_shifts.find_one({"id": shift_id})
        if shift and shift.get("check_in_time"):
            try:
                check_in = datetime.fromisoformat(shift["check_in_time"].replace("Z", "+00:00"))
                check_out = datetime.fromisoformat(update["check_out_time"].replace("Z", "+00:00"))
                hours = (check_out - check_in).total_seconds() / 3600
                update["hours_logged"] = round(hours, 2)
                
                # Update volunteer hours
                if shift.get("volunteer_id"):
                    await db.shelter_volunteers.update_one(
                        {"id": shift["volunteer_id"]},
                        {"$inc": {"total_hours_logged": update["hours_logged"], "hours_this_month": update["hours_logged"], "total_shifts_completed": 1}}
                    )
            except:
                pass
    
    await db.shelter_shifts.update_one({"id": shift_id, "shelter_id": shelter_id}, {"$set": update})
    result = await db.shelter_shifts.find_one({"id": shift_id}, {"_id": 0})
    return result


@router.post("/shifts/{shift_id}/check-in")
async def check_in_shift(shift_id: str, current_user: dict = Depends(get_current_user)):
    """Check in to a shift"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    await db.shelter_shifts.update_one(
        {"id": shift_id, "shelter_id": shelter_id},
        {"$set": {"status": "in_progress", "check_in_time": now}}
    )
    return {"status": "checked_in", "time": now}


@router.post("/shifts/{shift_id}/check-out")
async def check_out_shift(shift_id: str, data: dict = {}, current_user: dict = Depends(get_current_user)):
    """Check out from a shift"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    shift = await db.shelter_shifts.find_one({"id": shift_id, "shelter_id": shelter_id})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    hours = 0
    if shift.get("check_in_time"):
        try:
            check_in = datetime.fromisoformat(shift["check_in_time"].replace("Z", "+00:00"))
            check_out = datetime.now(timezone.utc)
            hours = round((check_out - check_in).total_seconds() / 3600, 2)
        except:
            pass
    
    await db.shelter_shifts.update_one(
        {"id": shift_id},
        {"$set": {
            "status": "completed",
            "check_out_time": now,
            "hours_logged": hours,
            "tasks_completed": data.get("tasks_completed", []),
            "notes": data.get("notes", shift.get("notes", ""))
        }}
    )
    
    # Update volunteer hours
    if shift.get("volunteer_id"):
        await db.shelter_volunteers.update_one(
            {"id": shift["volunteer_id"]},
            {"$inc": {"total_hours_logged": hours, "hours_this_month": hours, "total_shifts_completed": 1}}
        )
    
    return {"status": "checked_out", "hours_logged": hours}


@router.delete("/shifts/{shift_id}")
async def delete_shift(shift_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a shift"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_shifts.delete_one({"id": shift_id, "shelter_id": shelter_id})
    return {"status": "deleted"}


# ═══════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════

@router.get("/notifications")
async def get_notifications(unread_only: bool = False, current_user: dict = Depends(get_current_user)):
    """Get notifications for current user"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    
    query = {
        "shelter_id": shelter_id,
        "$or": [
            {"recipient_id": current_user["sub"]},
            {"recipient_id": None}  # Broadcast notifications
        ]
    }
    if unread_only:
        query["read"] = False
    
    notifications = await db.shelter_notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications


@router.post("/notifications")
async def create_notification(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a notification"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "notification_type": data.get("notification_type", "info"),  # info, warning, alert, reminder
        "title": data.get("title", ""),
        "message": data.get("message", ""),
        "recipient_id": data.get("recipient_id"),  # None = all users
        "entity_type": data.get("entity_type"),  # animal, application, task, etc.
        "entity_id": data.get("entity_id"),
        "action_url": data.get("action_url"),
        "read": False,
        "created_at": now,
    }
    await db.shelter_notifications.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_notifications.update_one(
        {"id": notification_id, "shelter_id": shelter_id},
        {"$set": {"read": True}}
    )
    return {"status": "read"}


@router.put("/notifications/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    await db.shelter_notifications.update_many(
        {"shelter_id": shelter_id, "$or": [{"recipient_id": current_user["sub"]}, {"recipient_id": None}]},
        {"$set": {"read": True}}
    )
    return {"status": "all_read"}


@router.get("/notifications/count")
async def get_notification_count(current_user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    count = await db.shelter_notifications.count_documents({
        "shelter_id": shelter_id,
        "read": False,
        "$or": [{"recipient_id": current_user["sub"]}, {"recipient_id": None}]
    })
    return {"count": count}


# ═══════════════════════════════════════════════════════════
# E-CONTRACTS
# ═══════════════════════════════════════════════════════════

@router.get("/contracts")
async def get_contracts(current_user: dict = Depends(get_current_user)):
    """Get contract templates"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    contracts = await db.shelter_contracts.find({"shelter_id": shelter_id}, {"_id": 0}).to_list(50)
    return contracts


@router.post("/contracts")
async def create_contract(data: dict, current_user: dict = Depends(get_current_user)):
    """Create a contract template"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "name": data.get("name", ""),
        "contract_type": data.get("contract_type", "adoption"),  # adoption, foster, volunteer, surrender
        "content": data.get("content", ""),
        "required_fields": data.get("required_fields", ["adopter_name", "adopter_signature", "date"]),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    await db.shelter_contracts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.put("/contracts/{contract_id}")
async def update_contract(contract_id: str, data: dict, current_user: dict = Depends(get_current_user)):
    """Update contract template"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    update = {k: v for k, v in data.items() if v is not None and k != "id"}
    update["updated_at"] = now_iso()
    await db.shelter_contracts.update_one({"id": contract_id, "shelter_id": shelter_id}, {"$set": update})
    result = await db.shelter_contracts.find_one({"id": contract_id}, {"_id": 0})
    return result


@router.get("/signed-contracts")
async def get_signed_contracts(entity_type: str = None, entity_id: str = None, current_user: dict = Depends(get_current_user)):
    """Get signed contracts"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    query = {"shelter_id": shelter_id}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    contracts = await db.shelter_signed_contracts.find(query, {"_id": 0}).sort("signed_at", -1).to_list(200)
    return contracts


@router.post("/signed-contracts")
async def sign_contract(data: dict, current_user: dict = Depends(get_current_user)):
    """Sign a contract"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = now_iso()
    
    # Get contract template
    template = await db.shelter_contracts.find_one({"id": data.get("contract_id"), "shelter_id": shelter_id})
    if not template:
        raise HTTPException(status_code=404, detail="Contract template not found")
    
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "contract_id": data.get("contract_id"),
        "contract_name": template.get("name"),
        "contract_type": template.get("contract_type"),
        "entity_type": data.get("entity_type"),  # animal, person
        "entity_id": data.get("entity_id"),
        "signer_name": data.get("signer_name", ""),
        "signer_email": data.get("signer_email", ""),
        "signature_data": data.get("signature_data", ""),  # Base64 signature image
        "filled_content": data.get("filled_content", template.get("content")),
        "field_values": data.get("field_values", {}),
        "signed_at": now,
        "ip_address": data.get("ip_address", ""),
        "witness_name": data.get("witness_name"),
        "witness_signature": data.get("witness_signature"),
    }
    await db.shelter_signed_contracts.insert_one(doc)
    
    # Activity log
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "action_type": "contract_signed",
        "description": f"{template.get('name')} signed by {data.get('signer_name')}",
        "performed_by": current_user["sub"],
        "created_at": now,
    })
    
    doc.pop("_id", None)
    return doc


# ═══════════════════════════════════════════════════════════
# ENHANCED ANALYTICS
# ═══════════════════════════════════════════════════════════

@router.get("/analytics/summary")
async def get_analytics_summary(period: str = "month", current_user: dict = Depends(get_current_user)):
    """Get comprehensive analytics summary"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    now = datetime.now(timezone.utc)
    
    if period == "week":
        start_date = (now - timedelta(days=7)).isoformat()
    elif period == "year":
        start_date = now.replace(month=1, day=1).isoformat()
    else:  # month
        start_date = now.replace(day=1).isoformat()
    
    # Intake stats
    total_intake = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "intake_date": {"$gte": start_date}})
    intake_by_type = await db.shelter_animals.aggregate([
        {"$match": {"shelter_id": shelter_id, "intake_date": {"$gte": start_date}}},
        {"$group": {"_id": "$intake_type", "count": {"$sum": 1}}}
    ]).to_list(20)
    intake_by_species = await db.shelter_animals.aggregate([
        {"$match": {"shelter_id": shelter_id, "intake_date": {"$gte": start_date}}},
        {"$group": {"_id": "$species", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    # Outcome stats
    total_outcomes = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "outcome_date": {"$gte": start_date}})
    outcome_by_type = await db.shelter_animals.aggregate([
        {"$match": {"shelter_id": shelter_id, "outcome_date": {"$gte": start_date}}},
        {"$group": {"_id": "$outcome_type", "count": {"$sum": 1}}}
    ]).to_list(20)
    
    # Adoption rate
    adoptions = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "outcome_type": "adoption", "outcome_date": {"$gte": start_date}})
    adoption_rate = (adoptions / total_intake * 100) if total_intake > 0 else 0
    
    # Average length of stay
    los_pipeline = [
        {"$match": {"shelter_id": shelter_id, "outcome_date": {"$gte": start_date}}},
        {"$project": {
            "days": {
                "$divide": [
                    {"$subtract": [{"$dateFromString": {"dateString": "$outcome_date"}}, {"$dateFromString": {"dateString": "$intake_date"}}]},
                    86400000
                ]
            }
        }},
        {"$group": {"_id": None, "avg_days": {"$avg": "$days"}}}
    ]
    los_result = await db.shelter_animals.aggregate(los_pipeline).to_list(1)
    avg_length_of_stay = round(los_result[0]["avg_days"], 1) if los_result else 0
    
    # Volunteer hours
    vol_hours = await db.shelter_shifts.aggregate([
        {"$match": {"shelter_id": shelter_id, "shift_date": {"$gte": start_date[:10]}, "status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$hours_logged"}}}
    ]).to_list(1)
    total_volunteer_hours = vol_hours[0]["total"] if vol_hours else 0
    
    # Donations
    donations = await db.shelter_donations.aggregate([
        {"$match": {"shelter_id": shelter_id, "donation_date": {"$gte": start_date}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}, "count": {"$sum": 1}}}
    ]).to_list(1)
    donation_total = donations[0]["total"] if donations else 0
    donation_count = donations[0]["count"] if donations else 0
    
    # Applications
    apps_received = await db.adoption_applications.count_documents({"shelter_id": shelter_id, "created_at": {"$gte": start_date}})
    apps_approved = await db.adoption_applications.count_documents({"shelter_id": shelter_id, "status": "approved", "updated_at": {"$gte": start_date}})
    
    return {
        "period": period,
        "intake": {
            "total": total_intake,
            "by_type": {i["_id"]: i["count"] for i in intake_by_type if i["_id"]},
            "by_species": {i["_id"]: i["count"] for i in intake_by_species if i["_id"]},
        },
        "outcomes": {
            "total": total_outcomes,
            "by_type": {o["_id"]: o["count"] for o in outcome_by_type if o["_id"]},
            "adoptions": adoptions,
            "adoption_rate": round(adoption_rate, 1),
        },
        "operations": {
            "avg_length_of_stay_days": avg_length_of_stay,
            "volunteer_hours": round(total_volunteer_hours, 1),
            "applications_received": apps_received,
            "applications_approved": apps_approved,
        },
        "fundraising": {
            "total_donations": donation_total,
            "donation_count": donation_count,
            "average_donation": round(donation_total / donation_count, 2) if donation_count > 0 else 0,
        }
    }


@router.get("/analytics/trends")
async def get_analytics_trends(current_user: dict = Depends(get_current_user)):
    """Get intake/outcome trends over time"""
    db = get_db()
    shelter_id = await _get_shelter_id(current_user, db)
    
    # Last 12 months
    now = datetime.now(timezone.utc)
    months = []
    for i in range(11, -1, -1):
        month_date = now - timedelta(days=i * 30)
        months.append(month_date.strftime("%Y-%m"))
    
    trends = []
    for month in months:
        intake = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "intake_date": {"$regex": f"^{month}"}})
        adoptions = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "outcome_type": "adoption", "outcome_date": {"$regex": f"^{month}"}})
        other_outcomes = await db.shelter_animals.count_documents({"shelter_id": shelter_id, "outcome_date": {"$regex": f"^{month}"}, "outcome_type": {"$ne": "adoption"}})
        
        trends.append({
            "month": month,
            "intake": intake,
            "adoptions": adoptions,
            "other_outcomes": other_outcomes,
        })
    
    return trends


# ═══════════════════════════════════════════════════════════
# PUBLIC ADOPTION PORTAL (No Auth Required)
# ═══════════════════════════════════════════════════════════

# These endpoints are public - no authentication required
public_router = APIRouter(prefix="/api/public/shelter")

@public_router.get("/{shelter_id}/animals")
async def public_get_animals(shelter_id: str, species: str = None, size: str = None):
    """Public endpoint to get adoptable animals"""
    from server import db
    
    query = {
        "shelter_id": shelter_id,
        "adoption_status": "available",
        "is_published": True,
        "outcome_date": None,
    }
    if species:
        query["species"] = species
    if size:
        query["size"] = size
    
    animals = await db.shelter_animals.find(query, {
        "_id": 0,
        "id": 1, "name": 1, "species": 1, "breed": 1, "sex": 1, "color": 1,
        "estimated_age_months": 1, "size": 1, "weight_kg": 1,
        "temperament": 1, "energy_level": 1,
        "good_with_dogs": 1, "good_with_cats": 1, "good_with_children": 1,
        "primary_photo_url": 1, "photos": 1, "featured": 1,
        "adoption_fee": 1, "ideal_home_description": 1,
        "days_in_shelter": 1,
    }).sort([("featured", -1), ("intake_date", 1)]).to_list(100)
    
    # Calculate days in shelter
    now = datetime.now(timezone.utc)
    for a in animals:
        if a.get("intake_date"):
            try:
                intake = datetime.fromisoformat(a["intake_date"].replace("Z", "+00:00"))
                a["days_in_shelter"] = max(0, (now - intake).days)
            except:
                a["days_in_shelter"] = 0
    
    return animals


@public_router.get("/{shelter_id}/animals/{animal_id}")
async def public_get_animal(shelter_id: str, animal_id: str):
    """Public endpoint to get single animal details"""
    from server import db
    
    animal = await db.shelter_animals.find_one(
        {"id": animal_id, "shelter_id": shelter_id, "is_published": True},
        {"_id": 0, "intake_notes": 0, "behavioral_flags": 0, "finder_name": 0, "finder_phone": 0}
    )
    if not animal:
        raise HTTPException(status_code=404, detail="Animal not found")
    return animal


@public_router.get("/{shelter_id}/info")
async def public_get_shelter_info(shelter_id: str):
    """Public endpoint to get shelter info"""
    from server import db
    
    shelter = await db.shelters.find_one({"id": shelter_id}, {
        "_id": 0,
        "id": 1, "name": 1, "description": 1, "mission_statement": 1,
        "phone": 1, "email": 1,
        "address_line1": 1, "city": 1, "state": 1, "postal_code": 1,
        "adoption_fee_dog": 1, "adoption_fee_cat": 1,
        "adoption_policy": 1,
    })
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")
    return shelter


@public_router.post("/{shelter_id}/apply")
async def public_submit_application(shelter_id: str, data: dict):
    """Public endpoint to submit adoption application"""
    from server import db
    
    now = now_iso()
    doc = {
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "animal_id": data.get("animal_id"),
        "applicant_id": None,
        "status": "submitted",
        "status_history": [{"status": "submitted", "date": now, "by": "public_portal"}],
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
        "hours_pet_alone": data.get("hours_pet_alone"),
        "exercise_plan": data.get("exercise_plan"),
        "current_vet_name": data.get("current_vet_name"),
        "current_vet_clinic": data.get("current_vet_clinic"),
        "current_vet_phone": data.get("current_vet_phone"),
        "references": data.get("references", []),
        "priority": "normal",
        "source": "public_portal",
        "created_at": now,
        "updated_at": now,
    }
    await db.adoption_applications.insert_one(doc)
    
    # Activity log
    await db.shelter_activity_log.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "action_type": "application_received",
        "description": f"Public application from {doc['applicant_name']}",
        "animal_id": data.get("animal_id"),
        "created_at": now,
    })
    
    # Create notification
    await db.shelter_notifications.insert_one({
        "id": str(uuid4()),
        "shelter_id": shelter_id,
        "notification_type": "alert",
        "title": "New Adoption Application",
        "message": f"New application from {doc['applicant_name']} for animal",
        "entity_type": "application",
        "entity_id": doc["id"],
        "read": False,
        "created_at": now,
    })
    
    return {"status": "submitted", "application_id": doc["id"]}
