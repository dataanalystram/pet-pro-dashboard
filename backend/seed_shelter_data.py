"""
Seed comprehensive data for all shelter features
Run with: python seed_shelter_data.py
"""

import asyncio
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import random
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Connect to MongoDB
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'pet_services')

def now_iso():
    return datetime.now(timezone.utc).isoformat()

def past_date(days_ago):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()

def future_date(days_ahead):
    return (datetime.now(timezone.utc) + timedelta(days=days_ahead)).isoformat()

async def seed_data():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get existing shelter
    shelter = await db.shelters.find_one({}, {"_id": 0})
    if not shelter:
        print("No shelter found. Please onboard a shelter first.")
        return
    
    shelter_id = shelter["id"]
    print(f"Seeding data for shelter: {shelter.get('name', shelter_id)}")
    
    # ═══════════════════════════════════════════════════════════
    # 1. SEED LOCATIONS/KENNELS
    # ═══════════════════════════════════════════════════════════
    print("\n📍 Creating Locations/Kennels...")
    
    locations_data = [
        {"name": "Kennel A-1", "location_type": "kennel", "building": "Main", "section": "A", "capacity": 2, "features": ["heated", "outdoor_access"]},
        {"name": "Kennel A-2", "location_type": "kennel", "building": "Main", "section": "A", "capacity": 2, "features": ["heated"]},
        {"name": "Kennel A-3", "location_type": "kennel", "building": "Main", "section": "A", "capacity": 1, "features": ["heated", "camera"]},
        {"name": "Kennel B-1", "location_type": "kennel", "building": "Main", "section": "B", "capacity": 3, "features": ["outdoor_access"]},
        {"name": "Kennel B-2", "location_type": "kennel", "building": "Main", "section": "B", "capacity": 2, "features": []},
        {"name": "Cat Room 1", "location_type": "room", "building": "Main", "section": "Cats", "capacity": 8, "features": ["climbing_structures", "heated"]},
        {"name": "Cat Room 2", "location_type": "room", "building": "Main", "section": "Cats", "capacity": 6, "features": ["window_perches"]},
        {"name": "Isolation 1", "location_type": "isolation", "building": "Medical", "section": "ISO", "capacity": 1, "is_isolation": True, "features": ["separate_ventilation"]},
        {"name": "Isolation 2", "location_type": "isolation", "building": "Medical", "section": "ISO", "capacity": 1, "is_isolation": True, "features": ["separate_ventilation"]},
        {"name": "Quarantine A", "location_type": "quarantine", "building": "Medical", "section": "QUA", "capacity": 2, "is_quarantine": True, "features": []},
        {"name": "Outdoor Run 1", "location_type": "outdoor", "building": "Yard", "section": "Outdoor", "capacity": 4, "features": ["grass", "shade"]},
        {"name": "Puppy Suite", "location_type": "room", "building": "Main", "section": "Puppies", "capacity": 6, "features": ["heated", "play_area"]},
    ]
    
    for loc in locations_data:
        existing = await db.shelter_locations.find_one({"shelter_id": shelter_id, "name": loc["name"]})
        if not existing:
            await db.shelter_locations.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "status": "available",
                "is_isolation": loc.get("is_isolation", False),
                "is_quarantine": loc.get("is_quarantine", False),
                "notes": "",
                "created_at": now_iso(),
                **loc
            })
    print(f"   ✅ Created {len(locations_data)} locations")
    
    # Get locations for reference
    locations = await db.shelter_locations.find({"shelter_id": shelter_id}).to_list(100)
    location_names = [l["name"] for l in locations]
    
    # ═══════════════════════════════════════════════════════════
    # 2. SEED MORE ANIMALS WITH LOCATIONS
    # ═══════════════════════════════════════════════════════════
    print("\n🐕 Creating Animals...")
    
    animals_data = [
        {"name": "Buddy", "species": "dog", "breed": "Golden Retriever", "sex": "male", "color": "Golden", "size": "large", "estimated_age_months": 36, "weight_kg": 32, "microchip_number": "985141234567890", "intake_type": "surrender", "adoption_status": "available", "current_location": "Kennel A-1", "temperament": "friendly", "energy_level": "high", "good_with_dogs": True, "good_with_cats": False, "good_with_children": True, "adoption_fee": 250},
        {"name": "Luna", "species": "dog", "breed": "German Shepherd", "sex": "female", "color": "Black & Tan", "size": "large", "estimated_age_months": 24, "weight_kg": 28, "microchip_number": "985141234567891", "intake_type": "stray", "adoption_status": "available", "current_location": "Kennel A-2", "temperament": "loyal", "energy_level": "high", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "adoption_fee": 275},
        {"name": "Max", "species": "dog", "breed": "Labrador Mix", "sex": "male", "color": "Black", "size": "large", "estimated_age_months": 48, "weight_kg": 30, "microchip_number": "985141234567892", "intake_type": "surrender", "adoption_status": "foster", "current_location": "Foster: Sarah Johnson", "temperament": "calm", "energy_level": "medium", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "adoption_fee": 200},
        {"name": "Bella", "species": "dog", "breed": "Beagle", "sex": "female", "color": "Tricolor", "size": "medium", "estimated_age_months": 18, "weight_kg": 12, "microchip_number": "985141234567893", "intake_type": "stray", "adoption_status": "available", "current_location": "Kennel B-1", "temperament": "playful", "energy_level": "high", "good_with_dogs": True, "good_with_cats": False, "good_with_children": True, "adoption_fee": 225},
        {"name": "Charlie", "species": "dog", "breed": "Poodle Mix", "sex": "male", "color": "White", "size": "small", "estimated_age_months": 60, "weight_kg": 8, "microchip_number": "985141234567894", "intake_type": "surrender", "adoption_status": "available", "current_location": "Kennel A-3", "temperament": "gentle", "energy_level": "low", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "adoption_fee": 175},
        {"name": "Whiskers", "species": "cat", "breed": "Domestic Shorthair", "sex": "male", "color": "Orange Tabby", "size": "medium", "estimated_age_months": 24, "weight_kg": 5, "microchip_number": "985141234567895", "intake_type": "stray", "adoption_status": "available", "current_location": "Cat Room 1", "temperament": "friendly", "energy_level": "medium", "good_with_dogs": False, "good_with_cats": True, "good_with_children": True, "adoption_fee": 125},
        {"name": "Shadow", "species": "cat", "breed": "Domestic Longhair", "sex": "female", "color": "Black", "size": "medium", "estimated_age_months": 36, "weight_kg": 4, "microchip_number": "985141234567896", "intake_type": "surrender", "adoption_status": "available", "current_location": "Cat Room 1", "temperament": "shy", "energy_level": "low", "good_with_dogs": False, "good_with_cats": True, "good_with_children": False, "adoption_fee": 100},
        {"name": "Mittens", "species": "cat", "breed": "Siamese Mix", "sex": "female", "color": "Seal Point", "size": "medium", "estimated_age_months": 12, "weight_kg": 3.5, "microchip_number": "985141234567897", "intake_type": "stray", "adoption_status": "foster", "current_location": "Foster: Mike Chen", "temperament": "vocal", "energy_level": "high", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "adoption_fee": 150},
        {"name": "Rocky", "species": "dog", "breed": "Pit Bull Mix", "sex": "male", "color": "Brindle", "size": "large", "estimated_age_months": 30, "weight_kg": 27, "microchip_number": "985141234567898", "intake_type": "confiscation", "adoption_status": "medical_hold", "current_location": "Isolation 1", "temperament": "recovering", "energy_level": "medium", "good_with_dogs": False, "good_with_cats": False, "good_with_children": False, "adoption_fee": 150},
        {"name": "Daisy", "species": "dog", "breed": "Corgi Mix", "sex": "female", "color": "Red & White", "size": "small", "estimated_age_months": 8, "weight_kg": 6, "microchip_number": "985141234567899", "intake_type": "transfer", "adoption_status": "available", "current_location": "Puppy Suite", "temperament": "energetic", "energy_level": "high", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "adoption_fee": 300},
        {"name": "Oliver", "species": "cat", "breed": "Maine Coon Mix", "sex": "male", "color": "Brown Tabby", "size": "large", "estimated_age_months": 48, "weight_kg": 7, "microchip_number": "985141234567900", "intake_type": "surrender", "adoption_status": "available", "current_location": "Cat Room 2", "temperament": "gentle giant", "energy_level": "low", "good_with_dogs": True, "good_with_cats": True, "good_with_children": True, "adoption_fee": 175},
        {"name": "Cleo", "species": "cat", "breed": "Calico", "sex": "female", "color": "Calico", "size": "medium", "estimated_age_months": 18, "weight_kg": 4, "microchip_number": "985141234567901", "intake_type": "stray", "adoption_status": "quarantine", "current_location": "Quarantine A", "temperament": "feisty", "energy_level": "high", "good_with_dogs": False, "good_with_cats": False, "good_with_children": False, "adoption_fee": 100},
    ]
    
    animal_ids = []
    for animal in animals_data:
        existing = await db.shelter_animals.find_one({"shelter_id": shelter_id, "name": animal["name"], "microchip_number": animal.get("microchip_number")})
        if not existing:
            animal_id = str(uuid4())
            intake_days_ago = random.randint(5, 90)
            await db.shelter_animals.insert_one({
                "id": animal_id,
                "shelter_id": shelter_id,
                "animal_id_code": f"SH-{random.randint(1000,9999)}",
                "intake_date": past_date(intake_days_ago),
                "is_published": True if animal["adoption_status"] == "available" else False,
                "featured": random.choice([True, False]),
                "days_in_shelter": intake_days_ago,
                "created_at": past_date(intake_days_ago),
                "updated_at": now_iso(),
                **animal
            })
            animal_ids.append(animal_id)
        else:
            animal_ids.append(existing["id"])
    print(f"   ✅ Created/Found {len(animals_data)} animals")
    
    # Get all animals
    all_animals = await db.shelter_animals.find({"shelter_id": shelter_id}).to_list(100)
    
    # ═══════════════════════════════════════════════════════════
    # 3. SEED VOLUNTEERS
    # ═══════════════════════════════════════════════════════════
    print("\n👥 Creating Volunteers...")
    
    volunteers_data = [
        {"full_name": "Sarah Johnson", "email": "sarah.j@email.com", "phone": "+353 87 123 4567", "skills": ["dog_walking", "cat_care", "cleaning"], "availability": ["weekends", "evenings"], "is_foster": True, "application_status": "approved", "experience_level": "experienced", "total_hours_logged": 156, "total_shifts_completed": 42},
        {"full_name": "Mike Chen", "email": "mike.chen@email.com", "phone": "+353 87 234 5678", "skills": ["dog_walking", "admin", "events"], "availability": ["weekdays"], "is_foster": True, "application_status": "approved", "experience_level": "experienced", "total_hours_logged": 234, "total_shifts_completed": 67},
        {"full_name": "Emma Wilson", "email": "emma.w@email.com", "phone": "+353 87 345 6789", "skills": ["cat_care", "cleaning", "feeding"], "availability": ["weekends"], "is_foster": False, "application_status": "approved", "experience_level": "intermediate", "total_hours_logged": 89, "total_shifts_completed": 28},
        {"full_name": "James Murphy", "email": "james.m@email.com", "phone": "+353 87 456 7890", "skills": ["dog_walking", "transport"], "availability": ["flexible"], "is_foster": False, "application_status": "approved", "experience_level": "beginner", "total_hours_logged": 45, "total_shifts_completed": 15},
        {"full_name": "Lisa O'Brien", "email": "lisa.ob@email.com", "phone": "+353 87 567 8901", "skills": ["admin", "events", "fundraising"], "availability": ["weekdays", "evenings"], "is_foster": True, "application_status": "approved", "experience_level": "experienced", "total_hours_logged": 312, "total_shifts_completed": 89},
        {"full_name": "David Kelly", "email": "david.k@email.com", "phone": "+353 87 678 9012", "skills": ["dog_walking", "cleaning"], "availability": ["weekends"], "is_foster": False, "application_status": "approved", "experience_level": "intermediate", "total_hours_logged": 67, "total_shifts_completed": 22},
        {"full_name": "Amy Ryan", "email": "amy.r@email.com", "phone": "+353 87 789 0123", "skills": ["cat_care", "feeding"], "availability": ["mornings"], "is_foster": False, "application_status": "pending", "experience_level": "beginner", "total_hours_logged": 0, "total_shifts_completed": 0},
    ]
    
    volunteer_ids = []
    for vol in volunteers_data:
        existing = await db.shelter_volunteers.find_one({"shelter_id": shelter_id, "email": vol["email"]})
        if not existing:
            vol_id = str(uuid4())
            await db.shelter_volunteers.insert_one({
                "id": vol_id,
                "shelter_id": shelter_id,
                "hours_this_month": random.randint(0, 30),
                "reliability_score": random.uniform(0.8, 1.0),
                "background_check_status": "cleared" if vol["application_status"] == "approved" else "pending",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_phone": "+353 87 999 9999",
                "notes": "",
                "created_at": past_date(random.randint(30, 365)),
                **vol
            })
            volunteer_ids.append(vol_id)
        else:
            volunteer_ids.append(existing["id"])
    print(f"   ✅ Created/Found {len(volunteers_data)} volunteers")
    
    # Get approved volunteers
    approved_volunteers = await db.shelter_volunteers.find({"shelter_id": shelter_id, "application_status": "approved"}).to_list(100)
    
    # ═══════════════════════════════════════════════════════════
    # 4. SEED FOSTERS
    # ═══════════════════════════════════════════════════════════
    print("\n🏠 Creating Foster Placements...")
    
    # Find animals in foster
    foster_animals = [a for a in all_animals if a.get("adoption_status") == "foster"]
    foster_volunteers = [v for v in approved_volunteers if v.get("is_foster")]
    
    fosters_data = [
        {"animal_name": "Max", "foster_parent_name": "Sarah Johnson", "foster_type": "standard", "special_instructions": "Needs daily medication for skin condition. Apply cream twice daily.", "feeding_schedule": "2 cups dry food morning, 1.5 cups evening", "check_in_frequency": "weekly", "status": "active", "days_ago": 14},
        {"animal_name": "Mittens", "foster_parent_name": "Mike Chen", "foster_type": "medical", "special_instructions": "Recovering from URI. Keep isolated from other cats. Monitor for sneezing.", "feeding_schedule": "Free feed dry food, 1/4 can wet food twice daily", "check_in_frequency": "every_3_days", "status": "active", "days_ago": 7},
        {"animal_name": "Buddy", "foster_parent_name": "Lisa O'Brien", "foster_type": "behavioral", "special_instructions": "Working on leash reactivity. Use gentle leader harness.", "feeding_schedule": "3 cups dry food split into 2 meals", "check_in_frequency": "weekly", "status": "completed", "days_ago": 45, "completed_days_ago": 5},
    ]
    
    for foster_data in fosters_data:
        existing = await db.shelter_fosters.find_one({
            "shelter_id": shelter_id, 
            "foster_parent_name": foster_data["foster_parent_name"],
            "status": foster_data["status"]
        })
        if not existing:
            # Find matching animal and volunteer
            animal = next((a for a in all_animals if a["name"] == foster_data["animal_name"]), None)
            volunteer = next((v for v in approved_volunteers if v["full_name"] == foster_data["foster_parent_name"]), None)
            
            foster_doc = {
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "animal_id": animal["id"] if animal else None,
                "foster_parent_id": volunteer["id"] if volunteer else None,
                "foster_parent_name": foster_data["foster_parent_name"],
                "foster_parent_email": volunteer["email"] if volunteer else "",
                "foster_parent_phone": volunteer["phone"] if volunteer else "",
                "start_date": past_date(foster_data["days_ago"]),
                "expected_end_date": future_date(14) if foster_data["status"] == "active" else None,
                "actual_end_date": past_date(foster_data.get("completed_days_ago", 0)) if foster_data["status"] == "completed" else None,
                "status": foster_data["status"],
                "foster_type": foster_data["foster_type"],
                "supplies_provided": ["food", "bowls", "bed", "leash"],
                "special_instructions": foster_data["special_instructions"],
                "feeding_schedule": foster_data["feeding_schedule"],
                "medication_instructions": "",
                "vet_contact": "Dublin Animal Hospital - +353 1 234 5678",
                "emergency_protocol": "Call shelter hotline immediately for emergencies",
                "check_in_frequency": foster_data["check_in_frequency"],
                "notes": [
                    {"id": str(uuid4()), "content": "Initial placement went smoothly. Animal settling in well.", "note_type": "general", "author": "System", "created_at": past_date(foster_data["days_ago"])},
                    {"id": str(uuid4()), "content": "Week 1 check-in: Eating well, good energy levels.", "note_type": "check_in", "author": foster_data["foster_parent_name"], "created_at": past_date(max(0, foster_data["days_ago"] - 7))},
                ],
                "created_at": past_date(foster_data["days_ago"]),
                "updated_at": now_iso(),
            }
            await db.shelter_fosters.insert_one(foster_doc)
    print(f"   ✅ Created {len(fosters_data)} foster placements")
    
    # ═══════════════════════════════════════════════════════════
    # 5. SEED LOST & FOUND REPORTS
    # ═══════════════════════════════════════════════════════════
    print("\n🔍 Creating Lost & Found Reports...")
    
    lost_found_data = [
        {"report_type": "found", "species": "dog", "breed": "Terrier Mix", "color": "White & Brown", "size": "small", "sex": "male", "description": "Found wandering near Phoenix Park. Friendly, wearing blue collar but no tags.", "last_seen_location": "Phoenix Park, Dublin 8", "reporter_name": "John Smith", "reporter_phone": "+353 87 111 2222", "reporter_email": "john.s@email.com", "status": "active", "days_ago": 3},
        {"report_type": "lost", "species": "cat", "breed": "Persian", "color": "White", "size": "medium", "sex": "female", "name": "Snowball", "description": "Indoor cat escaped through window. Very timid, may hide.", "last_seen_location": "Ranelagh, Dublin 6", "reporter_name": "Mary O'Connor", "reporter_phone": "+353 87 333 4444", "reporter_email": "mary.oc@email.com", "status": "active", "days_ago": 5},
        {"report_type": "found", "species": "cat", "breed": "Domestic Shorthair", "color": "Gray Tabby", "size": "medium", "sex": "unknown", "description": "Found in garden shed. Appears healthy but thin. Very friendly.", "last_seen_location": "Blackrock, Co. Dublin", "reporter_name": "Tom Walsh", "reporter_phone": "+353 87 555 6666", "reporter_email": "tom.w@email.com", "status": "matched", "days_ago": 10},
        {"report_type": "lost", "species": "dog", "breed": "Jack Russell", "color": "White & Tan", "size": "small", "sex": "male", "name": "Biscuit", "description": "Escaped during walk. Has distinctive brown patch over left eye.", "last_seen_location": "Howth, Dublin", "reporter_name": "Claire Doyle", "reporter_phone": "+353 87 777 8888", "reporter_email": "claire.d@email.com", "status": "resolved", "days_ago": 14},
        {"report_type": "found", "species": "dog", "breed": "Unknown", "color": "Black", "size": "large", "sex": "male", "description": "Large black dog found on motorway. Brought to shelter. Very scared but gentle.", "last_seen_location": "M50 near Exit 9", "reporter_name": "Garda Station", "reporter_phone": "+353 1 666 7777", "reporter_email": "info@garda.ie", "status": "active", "days_ago": 1},
    ]
    
    for report in lost_found_data:
        existing = await db.shelter_lost_found.find_one({
            "shelter_id": shelter_id,
            "reporter_name": report["reporter_name"],
            "report_type": report["report_type"]
        })
        if not existing:
            await db.shelter_lost_found.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "name": report.get("name", ""),
                "age_estimate": "",
                "distinguishing_features": report.get("distinguishing_features", ""),
                "microchip_number": "",
                "collar_description": report.get("collar_description", ""),
                "last_seen_date": past_date(report["days_ago"]),
                "last_seen_address": "",
                "photos": [],
                "matched_animal_id": None,
                "matched_report_id": None,
                "resolution_notes": "Reunited with owner" if report["status"] == "resolved" else None,
                "resolved_at": past_date(report["days_ago"] - 2) if report["status"] == "resolved" else None,
                "created_at": past_date(report["days_ago"]),
                "updated_at": now_iso(),
                **{k: v for k, v in report.items() if k != "days_ago"}
            })
    print(f"   ✅ Created {len(lost_found_data)} lost/found reports")
    
    # ═══════════════════════════════════════════════════════════
    # 6. SEED VOLUNTEER SHIFTS
    # ═══════════════════════════════════════════════════════════
    print("\n📅 Creating Volunteer Shifts...")
    
    shift_types = ["dog_walking", "cat_care", "cleaning", "feeding", "admin", "events"]
    areas = ["Kennel Area A", "Kennel Area B", "Cat Rooms", "Reception", "Outdoor Runs", "Medical Wing"]
    
    shifts_created = 0
    for volunteer in approved_volunteers[:5]:
        # Past completed shifts
        for i in range(random.randint(3, 8)):
            days_ago = random.randint(1, 30)
            start_hour = random.choice([8, 9, 10, 13, 14])
            duration = random.choice([3, 4, 5])
            
            shift_doc = {
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "volunteer_id": volunteer["id"],
                "shift_date": past_date(days_ago).split("T")[0],
                "start_time": f"{start_hour:02d}:00",
                "end_time": f"{start_hour + duration:02d}:00",
                "shift_type": random.choice(shift_types),
                "area_assigned": random.choice(areas),
                "status": "completed",
                "hours_logged": duration + random.uniform(-0.5, 0.5),
                "check_in_time": past_date(days_ago),
                "check_out_time": past_date(days_ago),
                "tasks_completed": ["Completed assigned duties"],
                "notes": "",
                "created_at": past_date(days_ago + 7),
            }
            await db.shelter_shifts.insert_one(shift_doc)
            shifts_created += 1
        
        # Future scheduled shifts
        for i in range(random.randint(1, 3)):
            days_ahead = random.randint(1, 14)
            start_hour = random.choice([9, 10, 13, 14])
            duration = random.choice([3, 4])
            
            shift_doc = {
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "volunteer_id": volunteer["id"],
                "shift_date": future_date(days_ahead).split("T")[0],
                "start_time": f"{start_hour:02d}:00",
                "end_time": f"{start_hour + duration:02d}:00",
                "shift_type": random.choice(shift_types),
                "area_assigned": random.choice(areas),
                "status": "scheduled",
                "hours_logged": 0,
                "check_in_time": None,
                "check_out_time": None,
                "tasks_completed": [],
                "notes": "",
                "created_at": now_iso(),
            }
            await db.shelter_shifts.insert_one(shift_doc)
            shifts_created += 1
    
    # Today's shifts (some in progress)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for volunteer in approved_volunteers[:3]:
        shift_doc = {
            "id": str(uuid4()),
            "shelter_id": shelter_id,
            "volunteer_id": volunteer["id"],
            "shift_date": today,
            "start_time": "09:00",
            "end_time": "13:00",
            "shift_type": random.choice(shift_types),
            "area_assigned": random.choice(areas),
            "status": random.choice(["scheduled", "in_progress"]),
            "hours_logged": 0,
            "check_in_time": now_iso() if random.random() > 0.5 else None,
            "check_out_time": None,
            "tasks_completed": [],
            "notes": "",
            "created_at": past_date(3),
        }
        await db.shelter_shifts.insert_one(shift_doc)
        shifts_created += 1
    
    print(f"   ✅ Created {shifts_created} shifts")
    
    # ═══════════════════════════════════════════════════════════
    # 7. SEED CONTRACT TEMPLATES
    # ═══════════════════════════════════════════════════════════
    print("\n📝 Creating Contract Templates...")
    
    contracts_data = [
        {
            "name": "Standard Adoption Agreement",
            "contract_type": "adoption",
            "content": """ADOPTION AGREEMENT

This adoption agreement is made between:

SHELTER: {{shelter_name}}
Address: 123 Animal Way, Dublin, Ireland

ADOPTER: {{adopter_name}}
Email: {{adopter_email}}

ANIMAL: {{animal_name}}
Species: {{animal_species}}
Breed: {{animal_breed}}
ID Code: {{animal_id}}

DATE: {{date}}

TERMS AND CONDITIONS:

1. CARE COMMITMENT
The Adopter agrees to provide proper food, water, shelter, and veterinary care for the adopted animal for its entire lifetime.

2. IDENTIFICATION
The Adopter agrees to keep current identification (microchip/collar with tags) on the animal at all times.

3. NO TRANSFER
The Adopter agrees not to sell, give away, or transfer ownership without written consent from the Shelter.

4. RETURN POLICY
If the Adopter can no longer care for the animal, they must return it to the Shelter rather than surrendering to another facility.

5. SPAY/NEUTER
The animal has been spayed/neutered, or the Adopter agrees to have this done within 30 days.

6. FOLLOW-UP
The Shelter may conduct follow-up visits to ensure the animal's welfare.

ADOPTION FEE: €{{adoption_fee}}

By signing below, both parties agree to these terms.

Adopter Signature: _________________________
Date: _________________________

Shelter Representative: _________________________
Date: _________________________"""
        },
        {
            "name": "Foster Care Agreement",
            "contract_type": "foster",
            "content": """FOSTER CARE AGREEMENT

SHELTER: {{shelter_name}}
FOSTER PARENT: {{foster_name}}
ANIMAL: {{animal_name}} ({{animal_species}})
FOSTER PERIOD: {{start_date}} to {{end_date}}

RESPONSIBILITIES:
1. Provide safe indoor housing
2. Follow feeding and medication instructions
3. Attend scheduled vet appointments
4. Report any health concerns immediately
5. Keep animal separate from personal pets if required
6. Return animal when requested

SHELTER PROVIDES:
- Food and supplies
- Veterinary care
- 24/7 emergency support

Foster Parent Signature: _________________________
Date: _________________________"""
        },
        {
            "name": "Volunteer Agreement",
            "contract_type": "volunteer",
            "content": """VOLUNTEER AGREEMENT

I, {{volunteer_name}}, agree to:

1. Follow all shelter policies and procedures
2. Treat all animals with kindness and respect
3. Maintain confidentiality of shelter information
4. Report any incidents or concerns to staff
5. Complete assigned tasks to the best of my ability
6. Attend required training sessions

I understand that volunteering is at-will and either party may end this arrangement at any time.

Volunteer Signature: _________________________
Date: {{date}}
Emergency Contact: _________________________"""
        },
        {
            "name": "Surrender Agreement",
            "contract_type": "surrender",
            "content": """ANIMAL SURRENDER AGREEMENT

OWNER: {{owner_name}}
ANIMAL: {{animal_name}}
SPECIES: {{species}}
REASON FOR SURRENDER: {{surrender_reason}}

I hereby surrender all ownership rights of the above animal to {{shelter_name}}.

I understand that:
1. This surrender is permanent and irrevocable
2. The shelter will make all decisions regarding the animal's care and placement
3. I will not receive updates on the animal's status unless requested
4. Any fees associated with intake are non-refundable

Former Owner Signature: _________________________
Date: {{date}}"""
        }
    ]
    
    for contract in contracts_data:
        existing = await db.shelter_contracts.find_one({
            "shelter_id": shelter_id,
            "name": contract["name"]
        })
        if not existing:
            await db.shelter_contracts.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "required_fields": ["signature", "date"],
                "is_active": True,
                "created_at": past_date(90),
                "updated_at": now_iso(),
                **contract
            })
    print(f"   ✅ Created {len(contracts_data)} contract templates")
    
    # ═══════════════════════════════════════════════════════════
    # 8. SEED SIGNED CONTRACTS
    # ═══════════════════════════════════════════════════════════
    print("\n✍️ Creating Signed Contracts...")
    
    contracts = await db.shelter_contracts.find({"shelter_id": shelter_id}).to_list(10)
    adoption_contract = next((c for c in contracts if c["contract_type"] == "adoption"), None)
    volunteer_contract = next((c for c in contracts if c["contract_type"] == "volunteer"), None)
    
    signed_contracts_data = []
    
    if adoption_contract:
        signed_contracts_data.extend([
            {"contract_id": adoption_contract["id"], "contract_name": adoption_contract["name"], "contract_type": "adoption", "signer_name": "Jennifer Murphy", "signer_email": "jennifer.m@email.com", "days_ago": 15},
            {"contract_id": adoption_contract["id"], "contract_name": adoption_contract["name"], "contract_type": "adoption", "signer_name": "Patrick O'Neill", "signer_email": "patrick.on@email.com", "days_ago": 22},
            {"contract_id": adoption_contract["id"], "contract_name": adoption_contract["name"], "contract_type": "adoption", "signer_name": "Aoife Brennan", "signer_email": "aoife.b@email.com", "days_ago": 8},
        ])
    
    if volunteer_contract:
        for vol in approved_volunteers[:4]:
            signed_contracts_data.append({
                "contract_id": volunteer_contract["id"],
                "contract_name": volunteer_contract["name"],
                "contract_type": "volunteer",
                "signer_name": vol["full_name"],
                "signer_email": vol["email"],
                "days_ago": random.randint(30, 180)
            })
    
    for signed in signed_contracts_data:
        existing = await db.shelter_signed_contracts.find_one({
            "shelter_id": shelter_id,
            "signer_email": signed["signer_email"],
            "contract_type": signed["contract_type"]
        })
        if not existing:
            await db.shelter_signed_contracts.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "entity_type": "person",
                "entity_id": None,
                "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "filled_content": "Contract signed and filed.",
                "field_values": {},
                "signed_at": past_date(signed["days_ago"]),
                "ip_address": "192.168.1.1",
                "witness_name": None,
                "witness_signature": None,
                **{k: v for k, v in signed.items() if k != "days_ago"}
            })
    print(f"   ✅ Created {len(signed_contracts_data)} signed contracts")
    
    # ═══════════════════════════════════════════════════════════
    # 9. SEED NOTIFICATIONS
    # ═══════════════════════════════════════════════════════════
    print("\n🔔 Creating Notifications...")
    
    notifications_data = [
        {"notification_type": "alert", "title": "New Adoption Application", "message": "Jennifer Murphy has submitted an application for Buddy (Golden Retriever)", "entity_type": "application", "read": False},
        {"notification_type": "reminder", "title": "Medical Reminder", "message": "Rocky is due for vaccination booster tomorrow", "entity_type": "medical", "read": False},
        {"notification_type": "info", "title": "Foster Check-in Due", "message": "Weekly check-in due for Max with foster parent Sarah Johnson", "entity_type": "foster", "read": False},
        {"notification_type": "alert", "title": "Lost Pet Report", "message": "New lost pet report filed: White Persian cat in Ranelagh area", "entity_type": "lost_found", "read": True},
        {"notification_type": "info", "title": "Shift Reminder", "message": "You have a shift scheduled tomorrow at 9:00 AM", "entity_type": "shift", "read": True},
        {"notification_type": "warning", "title": "Low Capacity Alert", "message": "Cat Room 1 is at 90% capacity", "entity_type": "location", "read": False},
        {"notification_type": "info", "title": "Donation Received", "message": "€500 donation received from Dublin Pet Lovers Foundation", "entity_type": "donation", "read": True},
        {"notification_type": "alert", "title": "Application Update", "message": "Home check scheduled for Patrick O'Neill - adoption application", "entity_type": "application", "read": False},
    ]
    
    for notif in notifications_data:
        await db.shelter_notifications.insert_one({
            "id": str(uuid4()),
            "shelter_id": shelter_id,
            "recipient_id": None,
            "entity_id": None,
            "action_url": None,
            "created_at": past_date(random.randint(0, 7)),
            **notif
        })
    print(f"   ✅ Created {len(notifications_data)} notifications")
    
    # ═══════════════════════════════════════════════════════════
    # 10. SEED DONATIONS
    # ═══════════════════════════════════════════════════════════
    print("\n💰 Creating Donations...")
    
    donations_data = [
        {"donor_name": "Dublin Pet Lovers Foundation", "donor_email": "info@dublinpetlovers.ie", "amount": 500, "donation_type": "monetary", "is_recurring": False, "days_ago": 5},
        {"donor_name": "Anonymous", "donor_email": "", "amount": 100, "donation_type": "monetary", "is_recurring": False, "days_ago": 12},
        {"donor_name": "Sarah Johnson", "donor_email": "sarah.j@email.com", "amount": 50, "donation_type": "monetary", "is_recurring": True, "days_ago": 1},
        {"donor_name": "Pet Supply Co.", "donor_email": "contact@petsupply.ie", "amount": 0, "donation_type": "supplies", "item_description": "50kg dog food, 20kg cat food, 10 beds", "days_ago": 8},
        {"donor_name": "Mike Chen", "donor_email": "mike.chen@email.com", "amount": 75, "donation_type": "monetary", "is_recurring": True, "days_ago": 15},
        {"donor_name": "Emma Wilson", "donor_email": "emma.w@email.com", "amount": 25, "donation_type": "monetary", "is_recurring": False, "days_ago": 20},
        {"donor_name": "VetCare Ireland", "donor_email": "info@vetcare.ie", "amount": 1000, "donation_type": "monetary", "is_recurring": False, "days_ago": 30, "notes": "Annual sponsorship"},
        {"donor_name": "Local Business Group", "donor_email": "business@local.ie", "amount": 250, "donation_type": "monetary", "is_recurring": False, "days_ago": 45},
    ]
    
    for donation in donations_data:
        existing = await db.shelter_donations.find_one({
            "shelter_id": shelter_id,
            "donor_email": donation.get("donor_email", ""),
            "amount": donation["amount"],
            "donation_date": {"$regex": past_date(donation["days_ago"]).split("T")[0]}
        })
        if not existing:
            await db.shelter_donations.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "donation_date": past_date(donation["days_ago"]),
                "payment_method": "bank_transfer" if donation["amount"] > 200 else "card",
                "is_tax_deductible": True,
                "receipt_sent": True,
                "campaign_id": None,
                "notes": donation.get("notes", ""),
                "item_description": donation.get("item_description", ""),
                "created_at": past_date(donation["days_ago"]),
                **{k: v for k, v in donation.items() if k not in ["days_ago", "notes", "item_description"]}
            })
    print(f"   ✅ Created {len(donations_data)} donations")
    
    # ═══════════════════════════════════════════════════════════
    # 11. SEED ADOPTION APPLICATIONS
    # ═══════════════════════════════════════════════════════════
    print("\n📋 Creating Adoption Applications...")
    
    applications_data = [
        {"applicant_name": "Jennifer Murphy", "applicant_email": "jennifer.m@email.com", "animal_name": "Buddy", "status": "under_review", "days_ago": 3},
        {"applicant_name": "Patrick O'Neill", "applicant_email": "patrick.on@email.com", "animal_name": "Luna", "status": "home_check", "days_ago": 7},
        {"applicant_name": "Aoife Brennan", "applicant_email": "aoife.b@email.com", "animal_name": "Whiskers", "status": "approved", "days_ago": 10},
        {"applicant_name": "Sean Fitzgerald", "applicant_email": "sean.f@email.com", "animal_name": "Daisy", "status": "submitted", "days_ago": 1},
        {"applicant_name": "Niamh Kelly", "applicant_email": "niamh.k@email.com", "animal_name": "Oliver", "status": "interview", "days_ago": 5},
    ]
    
    for app in applications_data:
        animal = next((a for a in all_animals if a["name"] == app["animal_name"]), None)
        existing = await db.adoption_applications.find_one({
            "shelter_id": shelter_id,
            "applicant_email": app["applicant_email"]
        })
        if not existing:
            await db.adoption_applications.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "animal_id": animal["id"] if animal else None,
                "applicant_id": None,
                "status_history": [{"status": app["status"], "date": past_date(app["days_ago"]), "by": "staff"}],
                "applicant_phone": "+353 87 " + "".join([str(random.randint(0,9)) for _ in range(7)]),
                "applicant_address": f"{random.randint(1,200)} Main Street",
                "applicant_city": "Dublin",
                "applicant_state": "Dublin",
                "applicant_postal_code": f"D{random.randint(1,24):02d}",
                "housing_type": random.choice(["house", "apartment", "townhouse"]),
                "is_homeowner": random.choice([True, False]),
                "has_yard": random.choice([True, False]),
                "yard_fenced": random.choice([True, False]),
                "has_children_under_12": random.choice([True, False]),
                "current_pets": [],
                "pet_experience_level": random.choice(["first_time", "some_experience", "experienced"]),
                "reason_for_adopting": "Looking for a loving companion",
                "hours_pet_alone": str(random.randint(2, 8)),
                "priority": "normal",
                "source": "website",
                "created_at": past_date(app["days_ago"]),
                "updated_at": now_iso(),
                **{k: v for k, v in app.items() if k != "days_ago" and k != "animal_name"}
            })
    print(f"   ✅ Created {len(applications_data)} applications")
    
    # ═══════════════════════════════════════════════════════════
    # 12. SEED MEDICAL RECORDS
    # ═══════════════════════════════════════════════════════════
    print("\n💊 Creating Medical Records...")
    
    medical_types = ["vaccination", "examination", "treatment", "surgery", "medication"]
    
    medical_created = 0
    for animal in all_animals[:8]:
        # Intake exam
        await db.shelter_medical.insert_one({
            "id": str(uuid4()),
            "shelter_id": shelter_id,
            "animal_id": animal["id"],
            "record_type": "examination",
            "record_date": animal.get("intake_date", past_date(30)),
            "description": "Intake examination - general health assessment",
            "diagnosis": "Healthy on intake" if animal.get("adoption_status") != "medical_hold" else "Requires treatment",
            "treatment": "None required" if animal.get("adoption_status") != "medical_hold" else "Treatment plan initiated",
            "medications": [],
            "veterinarian": "Dr. Sarah O'Connor",
            "follow_up_date": None,
            "cost": random.randint(50, 150),
            "notes": "Standard intake procedures completed",
            "created_at": animal.get("intake_date", past_date(30)),
        })
        medical_created += 1
        
        # Vaccinations
        if animal.get("species") == "dog":
            vaccines = ["DHPP", "Rabies", "Bordetella"]
        else:
            vaccines = ["FVRCP", "Rabies"]
        
        for vaccine in vaccines:
            await db.shelter_medical.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "animal_id": animal["id"],
                "record_type": "vaccination",
                "record_date": past_date(random.randint(5, 25)),
                "description": f"{vaccine} vaccination administered",
                "diagnosis": None,
                "treatment": vaccine,
                "medications": [],
                "veterinarian": "Dr. Sarah O'Connor",
                "follow_up_date": future_date(365),
                "cost": random.randint(25, 75),
                "notes": f"Annual {vaccine} vaccine",
                "created_at": past_date(random.randint(5, 25)),
            })
            medical_created += 1
    
    print(f"   ✅ Created {medical_created} medical records")
    
    # ═══════════════════════════════════════════════════════════
    # 13. SEED DAILY TASKS
    # ═══════════════════════════════════════════════════════════
    print("\n📝 Creating Daily Tasks...")
    
    tasks_data = [
        {"title": "Morning feeding - Dogs", "category": "feeding", "priority": "high", "assigned_to": "Morning Staff", "due_time": "08:00", "status": "completed"},
        {"title": "Morning feeding - Cats", "category": "feeding", "priority": "high", "assigned_to": "Morning Staff", "due_time": "08:30", "status": "completed"},
        {"title": "Clean Kennel Area A", "category": "cleaning", "priority": "high", "assigned_to": "Cleaning Team", "due_time": "09:00", "status": "completed"},
        {"title": "Clean Cat Rooms", "category": "cleaning", "priority": "high", "assigned_to": "Cleaning Team", "due_time": "09:30", "status": "in_progress"},
        {"title": "Medication rounds", "category": "medical", "priority": "high", "assigned_to": "Medical Staff", "due_time": "10:00", "status": "pending"},
        {"title": "Dog walking - morning shift", "category": "exercise", "priority": "medium", "assigned_to": "Volunteers", "due_time": "10:30", "status": "pending"},
        {"title": "Update adoption profiles", "category": "admin", "priority": "low", "assigned_to": "Admin", "due_time": "14:00", "status": "pending"},
        {"title": "Evening feeding - All", "category": "feeding", "priority": "high", "assigned_to": "Evening Staff", "due_time": "17:00", "status": "pending"},
        {"title": "Final safety check", "category": "safety", "priority": "high", "assigned_to": "Closing Staff", "due_time": "20:00", "status": "pending"},
    ]
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for task in tasks_data:
        await db.shelter_tasks.insert_one({
            "id": str(uuid4()),
            "shelter_id": shelter_id,
            "task_date": today,
            "animal_id": None,
            "notes": "",
            "completed_at": now_iso() if task["status"] == "completed" else None,
            "completed_by": "System" if task["status"] == "completed" else None,
            "created_at": past_date(0),
            **task
        })
    print(f"   ✅ Created {len(tasks_data)} daily tasks")
    
    # ═══════════════════════════════════════════════════════════
    # 14. SEED ACTIVITY LOG
    # ═══════════════════════════════════════════════════════════
    print("\n📊 Creating Activity Log...")
    
    activities = [
        {"action_type": "animal_intake", "description": "New animal intake: Daisy (Corgi Mix)", "days_ago": 2},
        {"action_type": "adoption_completed", "description": "Adoption completed: Charlie adopted by Aoife Brennan", "days_ago": 3},
        {"action_type": "foster_placement", "description": "Max placed in foster with Sarah Johnson", "days_ago": 14},
        {"action_type": "medical_update", "description": "Vaccination administered to Luna", "days_ago": 5},
        {"action_type": "volunteer_shift", "description": "Volunteer shift completed by Mike Chen (4 hours)", "days_ago": 1},
        {"action_type": "donation_received", "description": "€500 donation received from Dublin Pet Lovers Foundation", "days_ago": 5},
        {"action_type": "application_received", "description": "New adoption application from Sean Fitzgerald for Daisy", "days_ago": 1},
        {"action_type": "lost_found_report", "description": "New found pet report filed: Terrier Mix near Phoenix Park", "days_ago": 3},
        {"action_type": "contract_signed", "description": "Adoption agreement signed by Patrick O'Neill", "days_ago": 7},
        {"action_type": "animal_moved", "description": "Rocky moved to Isolation 1 for medical treatment", "days_ago": 4},
    ]
    
    for activity in activities:
        await db.shelter_activity_log.insert_one({
            "id": str(uuid4()),
            "shelter_id": shelter_id,
            "performed_by": "System",
            "animal_id": None,
            "person_id": None,
            "created_at": past_date(activity["days_ago"]),
            **{k: v for k, v in activity.items() if k != "days_ago"}
        })
    print(f"   ✅ Created {len(activities)} activity log entries")
    
    # ═══════════════════════════════════════════════════════════
    # 15. SEED PEOPLE/CRM
    # ═══════════════════════════════════════════════════════════
    print("\n👤 Creating People/CRM Records...")
    
    people_data = [
        {"full_name": "Jennifer Murphy", "email": "jennifer.m@email.com", "phone": "+353 87 111 1111", "tags": ["adopter", "applicant"], "adoption_count": 0},
        {"full_name": "Patrick O'Neill", "email": "patrick.on@email.com", "phone": "+353 87 222 2222", "tags": ["adopter", "applicant"], "adoption_count": 0},
        {"full_name": "Aoife Brennan", "email": "aoife.b@email.com", "phone": "+353 87 333 3333", "tags": ["adopter"], "adoption_count": 1},
        {"full_name": "Sean Fitzgerald", "email": "sean.f@email.com", "phone": "+353 87 444 4444", "tags": ["applicant"], "adoption_count": 0},
        {"full_name": "Dublin Pet Lovers Foundation", "email": "info@dublinpetlovers.ie", "phone": "+353 1 555 5555", "tags": ["donor", "corporate"], "donation_total": 500},
        {"full_name": "VetCare Ireland", "email": "info@vetcare.ie", "phone": "+353 1 666 6666", "tags": ["donor", "partner", "corporate"], "donation_total": 1000},
    ]
    
    for person in people_data:
        existing = await db.shelter_people.find_one({
            "shelter_id": shelter_id,
            "email": person["email"]
        })
        if not existing:
            await db.shelter_people.insert_one({
                "id": str(uuid4()),
                "shelter_id": shelter_id,
                "first_name": person["full_name"].split()[0],
                "last_name": " ".join(person["full_name"].split()[1:]),
                "address": "",
                "city": "Dublin",
                "state": "Dublin",
                "postal_code": "",
                "notes": "",
                "foster_count": 0,
                "volunteer_hours": 0,
                "created_at": past_date(random.randint(30, 180)),
                **person
            })
    print(f"   ✅ Created {len(people_data)} people records")
    
    print("\n" + "="*60)
    print("✅ SEED DATA COMPLETE!")
    print("="*60)
    print(f"""
Summary of created data:
- {len(locations_data)} Kennel/Cage Locations
- {len(animals_data)} Animals with locations assigned
- {len(volunteers_data)} Volunteers
- {len(fosters_data)} Foster Placements
- {len(lost_found_data)} Lost & Found Reports
- {shifts_created} Volunteer Shifts
- {len(contracts_data)} Contract Templates
- {len(signed_contracts_data)} Signed Contracts
- {len(notifications_data)} Notifications
- {len(donations_data)} Donations
- {len(applications_data)} Adoption Applications
- {medical_created} Medical Records
- {len(tasks_data)} Daily Tasks
- {len(activities)} Activity Log Entries
- {len(people_data)} People/CRM Records
""")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_data())
