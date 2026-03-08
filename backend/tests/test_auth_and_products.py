"""
Backend API Tests for Paw Paradise Multi-Product Platform
Tests authentication for all three products and key CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Demo credentials for each product
DEMO_CREDENTIALS = {
    'provider': {'email': 'demo@pawparadise.com', 'password': 'demo123'},
    'vet': {'email': 'vet@pawparadise.com', 'password': 'demo123'},
    'shelter': {'email': 'shelter@pawparadise.com', 'password': 'demo123'},
}


class TestAuthEndpoints:
    """Test authentication for all three products"""
    
    def test_service_provider_login(self):
        """Test Service Provider demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DEMO_CREDENTIALS['provider'])
        assert response.status_code == 200, f"Provider login failed: {response.text}"
        data = response.json()
        assert 'token' in data, "No token in response"
        assert 'user' in data, "No user in response"
        assert data['user']['email'] == DEMO_CREDENTIALS['provider']['email']
        print(f"✅ Service Provider login successful - User: {data['user']['full_name']}")
    
    def test_vet_clinic_login(self):
        """Test Vet Clinic demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DEMO_CREDENTIALS['vet'])
        assert response.status_code == 200, f"Vet login failed: {response.text}"
        data = response.json()
        assert 'token' in data, "No token in response"
        assert 'user' in data, "No user in response"
        assert data['user']['email'] == DEMO_CREDENTIALS['vet']['email']
        print(f"✅ Vet Clinic login successful - User: {data['user']['full_name']}")
    
    def test_shelter_login(self):
        """Test Shelter demo login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DEMO_CREDENTIALS['shelter'])
        assert response.status_code == 200, f"Shelter login failed: {response.text}"
        data = response.json()
        assert 'token' in data, "No token in response"
        assert 'user' in data, "No user in response"
        assert data['user']['email'] == DEMO_CREDENTIALS['shelter']['email']
        print(f"✅ Shelter login successful - User: {data['user']['full_name']}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            'email': 'invalid@test.com',
            'password': 'wrongpassword'
        })
        assert response.status_code == 401, "Invalid login should return 401"
        print("✅ Invalid login correctly rejected")


class TestVetClinicAPIs:
    """Test Vet Clinic specific endpoints"""
    
    @pytest.fixture
    def vet_token(self):
        """Get auth token for vet user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DEMO_CREDENTIALS['vet'])
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Vet login failed")
    
    def test_get_vet_staff(self, vet_token):
        """Test GET /api/vet/staff"""
        headers = {'Authorization': f'Bearer {vet_token}'}
        response = requests.get(f"{BASE_URL}/api/vet/staff", headers=headers)
        assert response.status_code == 200, f"Get staff failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Staff should be a list"
        print(f"✅ Vet Staff API - Found {len(data)} staff members")
    
    def test_get_vet_patients(self, vet_token):
        """Test GET /api/vet/patients"""
        headers = {'Authorization': f'Bearer {vet_token}'}
        response = requests.get(f"{BASE_URL}/api/vet/patients", headers=headers)
        assert response.status_code == 200, f"Get patients failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Patients should be a list"
        print(f"✅ Vet Patients API - Found {len(data)} patients")
    
    def test_get_vet_appointments(self, vet_token):
        """Test GET /api/vet/appointments"""
        headers = {'Authorization': f'Bearer {vet_token}'}
        response = requests.get(f"{BASE_URL}/api/vet/appointments", headers=headers)
        assert response.status_code == 200, f"Get appointments failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Appointments should be a list"
        print(f"✅ Vet Appointments API - Found {len(data)} appointments")
    
    def test_get_vet_clients(self, vet_token):
        """Test GET /api/vet/clients"""
        headers = {'Authorization': f'Bearer {vet_token}'}
        response = requests.get(f"{BASE_URL}/api/vet/clients", headers=headers)
        assert response.status_code == 200, f"Get clients failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Clients should be a list"
        print(f"✅ Vet Clients API - Found {len(data)} clients")
    
    def test_get_vet_dashboard_stats(self, vet_token):
        """Test GET /api/vet/dashboard/stats"""
        headers = {'Authorization': f'Bearer {vet_token}'}
        response = requests.get(f"{BASE_URL}/api/vet/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Get dashboard stats failed: {response.text}"
        data = response.json()
        assert 'today_appointments' in data or 'total_patients' in data, "Dashboard stats missing expected fields"
        print(f"✅ Vet Dashboard Stats API working")
    
    def test_create_vet_staff(self, vet_token):
        """Test POST /api/vet/staff - Create new staff member"""
        headers = {'Authorization': f'Bearer {vet_token}'}
        new_staff = {
            'full_name': 'TEST_Dr. Test User',
            'email': 'test_staff@dublinvet.ie',
            'role': 'veterinarian',
            'title': 'Test Veterinarian',
            'specialties': ['general'],
            'max_daily_appointments': 10
        }
        response = requests.post(f"{BASE_URL}/api/vet/staff", headers=headers, json=new_staff)
        assert response.status_code in [200, 201], f"Create staff failed: {response.text}"
        data = response.json()
        assert 'id' in data, "Created staff should have an ID"
        print(f"✅ Vet Staff Create API - Created staff with ID: {data['id']}")
        
        # Cleanup - delete the test staff
        staff_id = data['id']
        delete_response = requests.delete(f"{BASE_URL}/api/vet/staff/{staff_id}", headers=headers)
        print(f"   Cleanup: Deleted test staff (status: {delete_response.status_code})")


class TestShelterAPIs:
    """Test Shelter specific endpoints"""
    
    @pytest.fixture
    def shelter_token(self):
        """Get auth token for shelter user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DEMO_CREDENTIALS['shelter'])
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Shelter login failed")
    
    def test_get_shelter_animals(self, shelter_token):
        """Test GET /api/shelter/animals"""
        headers = {'Authorization': f'Bearer {shelter_token}'}
        response = requests.get(f"{BASE_URL}/api/shelter/animals", headers=headers)
        assert response.status_code == 200, f"Get animals failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Animals should be a list"
        print(f"✅ Shelter Animals API - Found {len(data)} animals")
    
    def test_get_shelter_volunteers(self, shelter_token):
        """Test GET /api/shelter/volunteers"""
        headers = {'Authorization': f'Bearer {shelter_token}'}
        response = requests.get(f"{BASE_URL}/api/shelter/volunteers", headers=headers)
        assert response.status_code == 200, f"Get volunteers failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Volunteers should be a list"
        print(f"✅ Shelter Volunteers API - Found {len(data)} volunteers")
    
    def test_get_shelter_tasks(self, shelter_token):
        """Test GET /api/shelter/tasks"""
        headers = {'Authorization': f'Bearer {shelter_token}'}
        response = requests.get(f"{BASE_URL}/api/shelter/tasks", headers=headers)
        assert response.status_code == 200, f"Get tasks failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Tasks should be a list"
        print(f"✅ Shelter Tasks API - Found {len(data)} tasks")
    
    def test_get_shelter_dashboard_stats(self, shelter_token):
        """Test GET /api/shelter/dashboard/stats"""
        headers = {'Authorization': f'Bearer {shelter_token}'}
        response = requests.get(f"{BASE_URL}/api/shelter/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Get dashboard stats failed: {response.text}"
        data = response.json()
        print(f"✅ Shelter Dashboard Stats API working")
    
    def test_create_shelter_animal(self, shelter_token):
        """Test POST /api/shelter/animals - Create new animal intake"""
        headers = {'Authorization': f'Bearer {shelter_token}'}
        new_animal = {
            'name': 'TEST_Buddy',
            'species': 'dog',
            'breed': 'Test Breed',
            'sex': 'male',
            'intake_type': 'stray',
            'intake_condition': 'healthy',
            'current_location': 'Test Kennel'
        }
        response = requests.post(f"{BASE_URL}/api/shelter/animals", headers=headers, json=new_animal)
        assert response.status_code in [200, 201], f"Create animal failed: {response.text}"
        data = response.json()
        assert 'id' in data, "Created animal should have an ID"
        print(f"✅ Shelter Animal Create API - Created animal with ID: {data['id']}")
        
        # Cleanup - delete the test animal
        animal_id = data['id']
        delete_response = requests.delete(f"{BASE_URL}/api/shelter/animals/{animal_id}", headers=headers)
        print(f"   Cleanup: Deleted test animal (status: {delete_response.status_code})")
    
    def test_create_shelter_volunteer(self, shelter_token):
        """Test POST /api/shelter/volunteers - Create new volunteer"""
        headers = {'Authorization': f'Bearer {shelter_token}'}
        new_volunteer = {
            'full_name': 'TEST_John Volunteer',
            'email': 'test_volunteer@example.com',
            'volunteer_type': ['dog_walking'],
            'skills': ['dog training']
        }
        response = requests.post(f"{BASE_URL}/api/shelter/volunteers", headers=headers, json=new_volunteer)
        assert response.status_code in [200, 201], f"Create volunteer failed: {response.text}"
        data = response.json()
        assert 'id' in data, "Created volunteer should have an ID"
        print(f"✅ Shelter Volunteer Create API - Created volunteer with ID: {data['id']}")
        
        # Cleanup - delete the test volunteer
        vol_id = data['id']
        delete_response = requests.delete(f"{BASE_URL}/api/shelter/volunteers/{vol_id}", headers=headers)
        print(f"   Cleanup: Deleted test volunteer (status: {delete_response.status_code})")


class TestServiceProviderAPIs:
    """Test Service Provider specific endpoints"""
    
    @pytest.fixture
    def provider_token(self):
        """Get auth token for provider user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=DEMO_CREDENTIALS['provider'])
        if response.status_code == 200:
            return response.json()['token']
        pytest.skip("Provider login failed")
    
    def test_get_provider_profile(self, provider_token):
        """Test GET /api/provider/profile"""
        headers = {'Authorization': f'Bearer {provider_token}'}
        response = requests.get(f"{BASE_URL}/api/provider/profile", headers=headers)
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        assert 'business_name' in data, "Profile should have business_name"
        print(f"✅ Provider Profile API - Business: {data.get('business_name')}")
    
    def test_get_provider_dashboard_stats(self, provider_token):
        """Test GET /api/provider/dashboard/stats"""
        headers = {'Authorization': f'Bearer {provider_token}'}
        response = requests.get(f"{BASE_URL}/api/provider/dashboard/stats", headers=headers)
        assert response.status_code == 200, f"Get dashboard stats failed: {response.text}"
        data = response.json()
        print(f"✅ Provider Dashboard Stats API working")
    
    def test_get_provider_bookings(self, provider_token):
        """Test GET /api/provider/bookings"""
        headers = {'Authorization': f'Bearer {provider_token}'}
        response = requests.get(f"{BASE_URL}/api/provider/bookings", headers=headers)
        assert response.status_code == 200, f"Get bookings failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Bookings should be a list"
        print(f"✅ Provider Bookings API - Found {len(data)} bookings")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
