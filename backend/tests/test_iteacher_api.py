"""
ITeacher API Backend Tests
Tests for: Authentication, Classes, Subjects, Teachers, Students, Messages, Attendance
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://schoolmate-108.preview.emergentagent.com')

# Test credentials
INSTITUTION_EMAIL = "test@institution.com"
INSTITUTION_PASSWORD = "test123456"
TEACHER_EMAIL = "teacher@test.com"
TEACHER_PASSWORD = "test123456"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "ITeacher" in data["message"]
        print("✓ API health check passed")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_institution_login_success(self):
        """Test institution user login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == INSTITUTION_EMAIL
        assert data["user"]["user_type"] == "institution"
        assert len(data["token"]) > 0
        print(f"✓ Institution login successful: {data['user']['name']}")
    
    def test_teacher_login_success(self):
        """Test teacher user login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEACHER_EMAIL
        assert data["user"]["user_type"] == "teacher"
        print(f"✓ Teacher login successful: {data['user']['name']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✓ Invalid credentials rejected correctly")
    
    def test_get_current_user(self):
        """Test getting current user with valid token"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Get current user
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == INSTITUTION_EMAIL
        print("✓ Get current user endpoint working")
    
    def test_register_new_user(self):
        """Test user registration"""
        timestamp = int(time.time())
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_newuser_{timestamp}@test.com",
            "password": "test123456",
            "name": f"TEST User {timestamp}",
            "user_type": "teacher"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["user_type"] == "teacher"
        print(f"✓ User registration successful: {data['user']['email']}")
    
    def test_register_duplicate_email(self):
        """Test registration with existing email"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": INSTITUTION_EMAIL,
            "password": "test123456",
            "name": "Duplicate User",
            "user_type": "teacher"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        print("✓ Duplicate email registration rejected correctly")


class TestClassManagement:
    """Class management endpoint tests"""
    
    @pytest.fixture
    def institution_token(self):
        """Get institution auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_class_as_institution(self, institution_token):
        """Test creating a class as institution"""
        timestamp = int(time.time())
        response = requests.post(f"{BASE_URL}/api/classes", 
            headers={"Authorization": f"Bearer {institution_token}"},
            json={
                "name": f"TEST_Class_{timestamp}",
                "description": "Test class description"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "class_id" in data
        assert data["name"] == f"TEST_Class_{timestamp}"
        print(f"✓ Class created: {data['name']}")
        return data["class_id"]
    
    def test_get_classes_as_institution(self, institution_token):
        """Test getting classes as institution"""
        response = requests.get(f"{BASE_URL}/api/classes",
            headers={"Authorization": f"Bearer {institution_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} classes")
    
    def test_get_classes_as_teacher(self, teacher_token):
        """Test getting classes as teacher"""
        response = requests.get(f"{BASE_URL}/api/classes",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Teacher retrieved {len(data)} assigned classes")
    
    def test_create_class_as_teacher_forbidden(self, teacher_token):
        """Test that teachers cannot create classes"""
        response = requests.post(f"{BASE_URL}/api/classes",
            headers={"Authorization": f"Bearer {teacher_token}"},
            json={
                "name": "Unauthorized Class",
                "description": "Should fail"
            }
        )
        assert response.status_code == 403
        print("✓ Teacher correctly forbidden from creating classes")


class TestSubjectManagement:
    """Subject management endpoint tests"""
    
    @pytest.fixture
    def institution_token(self):
        """Get institution auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        return response.json()["token"]
    
    def test_create_subject_as_institution(self, institution_token):
        """Test creating a subject as institution"""
        timestamp = int(time.time())
        response = requests.post(f"{BASE_URL}/api/subjects",
            headers={"Authorization": f"Bearer {institution_token}"},
            json={
                "name": f"TEST_Subject_{timestamp}",
                "description": "Test subject description"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "subject_id" in data
        assert data["name"] == f"TEST_Subject_{timestamp}"
        print(f"✓ Subject created: {data['name']}")
    
    def test_get_subjects_as_institution(self, institution_token):
        """Test getting subjects as institution"""
        response = requests.get(f"{BASE_URL}/api/subjects",
            headers={"Authorization": f"Bearer {institution_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} subjects")


class TestTeacherManagement:
    """Teacher management endpoint tests"""
    
    @pytest.fixture
    def institution_token(self):
        """Get institution auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        return response.json()["token"]
    
    def test_get_teachers_list(self, institution_token):
        """Test getting list of teachers"""
        response = requests.get(f"{BASE_URL}/api/teachers",
            headers={"Authorization": f"Bearer {institution_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Check that all returned users are teachers
        for teacher in data:
            assert teacher.get("user_type") == "teacher"
        print(f"✓ Retrieved {len(data)} teachers")


class TestMessageSystem:
    """Message system endpoint tests"""
    
    @pytest.fixture
    def institution_token(self):
        """Get institution auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def teacher_token(self):
        """Get teacher auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEACHER_EMAIL,
            "password": TEACHER_PASSWORD
        })
        return response.json()["token"]
    
    @pytest.fixture
    def teacher_user_id(self, teacher_token):
        """Get teacher user ID"""
        response = requests.get(f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {teacher_token}"}
        )
        return response.json()["user_id"]
    
    def test_send_message(self, institution_token, teacher_user_id):
        """Test sending a message"""
        timestamp = int(time.time())
        response = requests.post(f"{BASE_URL}/api/messages",
            headers={"Authorization": f"Bearer {institution_token}"},
            json={
                "recipient_id": teacher_user_id,
                "content": f"TEST_Message_{timestamp}: Hello from institution!"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "message_id" in data
        assert data["content"] == f"TEST_Message_{timestamp}: Hello from institution!"
        print(f"✓ Message sent successfully")
    
    def test_get_messages(self, institution_token):
        """Test getting messages"""
        response = requests.get(f"{BASE_URL}/api/messages",
            headers={"Authorization": f"Bearer {institution_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} messages")


class TestLogout:
    """Logout endpoint tests"""
    
    def test_logout(self):
        """Test logout functionality"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": INSTITUTION_EMAIL,
            "password": INSTITUTION_PASSWORD
        })
        token = login_response.json()["token"]
        
        # Logout
        response = requests.post(f"{BASE_URL}/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Logout successful")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
