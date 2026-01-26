import requests
import sys
import json
from datetime import datetime

class EduFlowAPITester:
    def __init__(self, base_url="https://classforge-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.institution_id = None
        self.teacher_id = None
        self.class_id = None
        self.student_id = None
        self.material_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "",
            200
        )
        return success

    def test_register_institution(self):
        """Test institution registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Register Institution",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"institution_{timestamp}@test.com",
                "password": "TestPass123!",
                "name": f"Test Institution {timestamp}",
                "user_type": "institution"
            }
        )
        if success and 'token' in response:
            self.institution_id = response['user']['user_id']
            print(f"   Institution ID: {self.institution_id}")
        return success, response

    def test_register_teacher(self):
        """Test teacher registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Register Teacher",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"teacher_{timestamp}@test.com",
                "password": "TestPass123!",
                "name": f"Test Teacher {timestamp}",
                "user_type": "teacher"
            }
        )
        if success and 'token' in response:
            self.teacher_id = response['user']['user_id']
            print(f"   Teacher ID: {self.teacher_id}")
        return success, response

    def test_login_institution(self, email, password):
        """Test institution login"""
        success, response = self.run_test(
            "Login Institution",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_data = response['user']
            print(f"   Token received: {self.token[:20]}...")
        return success, response

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success, response

    def test_create_class(self):
        """Test creating a class"""
        success, response = self.run_test(
            "Create Class",
            "POST",
            "classes",
            200,
            data={
                "name": "Test Mathematics Class",
                "description": "Advanced mathematics for grade 10",
                "institution_id": self.institution_id,
                "schedule": [
                    {"day": "Segunda", "time": "08:00", "duration": "60"},
                    {"day": "Quarta", "time": "10:00", "duration": "90"}
                ]
            }
        )
        if success and 'class_id' in response:
            self.class_id = response['class_id']
            print(f"   Class ID: {self.class_id}")
        return success, response

    def test_get_classes(self):
        """Test getting classes"""
        success, response = self.run_test(
            "Get Classes",
            "GET",
            "classes",
            200
        )
        return success, response

    def test_get_teachers(self):
        """Test getting teachers"""
        success, response = self.run_test(
            "Get Teachers",
            "GET",
            "teachers",
            200
        )
        return success, response

    def test_create_subject(self):
        """Test creating a subject"""
        success, response = self.run_test(
            "Create Subject",
            "POST",
            "subjects",
            200,
            data={
                "name": "Mathematics",
                "description": "Basic and advanced mathematics"
            }
        )
        if success and 'subject_id' in response:
            self.subject_id = response['subject_id']
            print(f"   Subject ID: {self.subject_id}")
        return success, response

    def test_assign_teacher(self):
        """Test assigning teacher to class"""
        if not self.teacher_id or not self.class_id or not hasattr(self, 'subject_id'):
            print("❌ Skipping - Need teacher_id, class_id, and subject_id")
            return False, {}
        
        success, response = self.run_test(
            "Assign Teacher to Class",
            "POST",
            "teacher-assignments",
            200,
            data={
                "teacher_id": self.teacher_id,
                "subject_id": self.subject_id,
                "class_id": self.class_id
            }
        )
        return success, response

    def test_add_student(self):
        """Test adding student to class"""
        if not self.class_id:
            print("❌ Skipping - Need class_id")
            return False, {}
        
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Add Student",
            "POST",
            "students",
            200,
            data={
                "name": f"Test Student {timestamp}",
                "email": f"student_{timestamp}@test.com",
                "enrollment_number": f"ENR{timestamp}",
                "class_id": self.class_id
            }
        )
        if success and 'student_id' in response:
            self.student_id = response['student_id']
            print(f"   Student ID: {self.student_id}")
        return success, response

    def test_get_students_by_class(self):
        """Test getting students by class"""
        if not self.class_id:
            print("❌ Skipping - Need class_id")
            return False, {}
        
        success, response = self.run_test(
            "Get Students by Class",
            "GET",
            f"students/class/{self.class_id}",
            200
        )
        return success, response

    def test_create_material(self):
        """Test creating material"""
        if not self.class_id or not hasattr(self, 'subject_id'):
            print("❌ Skipping - Need class_id and subject_id")
            return False, {}
        
        success, response = self.run_test(
            "Create Material",
            "POST",
            "materials",
            200,
            data={
                "title": "Introduction to Algebra",
                "description": "Basic algebraic concepts and operations",
                "content": "This material covers variables, equations, and basic problem solving.",
                "class_id": self.class_id,
                "subject_id": self.subject_id
            }
        )
        if success and 'material_id' in response:
            self.material_id = response['material_id']
            print(f"   Material ID: {self.material_id}")
        return success, response

    def test_get_materials_by_class(self):
        """Test getting materials by class"""
        if not self.class_id:
            print("❌ Skipping - Need class_id")
            return False, {}
        
        success, response = self.run_test(
            "Get Materials by Class",
            "GET",
            f"materials/class/{self.class_id}",
            200
        )
        return success, response

    def test_mark_attendance(self):
        """Test marking attendance"""
        if not self.student_id or not self.class_id:
            print("❌ Skipping - Need student_id and class_id")
            return False, {}
        
        success, response = self.run_test(
            "Mark Attendance",
            "POST",
            "attendance",
            200,
            data={
                "student_id": self.student_id,
                "class_id": self.class_id,
                "date": datetime.now().strftime('%Y-%m-%d'),
                "status": "present"
            }
        )
        return success, response

    def test_get_attendance(self):
        """Test getting attendance"""
        if not self.class_id:
            print("❌ Skipping - Need class_id")
            return False, {}
        
        success, response = self.run_test(
            "Get Attendance",
            "GET",
            f"attendance/class/{self.class_id}",
            200
        )
        return success, response

    def test_send_message(self):
        """Test sending message"""
        if not self.teacher_id:
            print("❌ Skipping - Need teacher_id")
            return False, {}
        
        success, response = self.run_test(
            "Send Message",
            "POST",
            "messages",
            200,
            data={
                "recipient_id": self.teacher_id,
                "content": "Welcome to our educational platform! Please check your assigned classes."
            }
        )
        return success, response

    def test_get_messages(self):
        """Test getting messages"""
        success, response = self.run_test(
            "Get Messages",
            "GET",
            "messages",
            200
        )
        return success, response

    def test_logout(self):
        """Test logout"""
        success, response = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success, response

def main():
    print("🚀 Starting EduFlow API Testing...")
    print("=" * 60)
    
    tester = EduFlowAPITester()
    
    # Test 1: Health Check
    if not tester.test_health_check():
        print("❌ Health check failed, stopping tests")
        return 1

    # Test 2: User Registration
    print("\n📝 Testing User Registration...")
    institution_success, institution_data = tester.test_register_institution()
    teacher_success, teacher_data = tester.test_register_teacher()
    
    if not institution_success:
        print("❌ Institution registration failed, stopping tests")
        return 1

    # Test 3: Login as Institution
    print("\n🔐 Testing Authentication...")
    institution_email = institution_data['user']['email']
    login_success, login_data = tester.test_login_institution(institution_email, "TestPass123!")
    
    if not login_success:
        print("❌ Login failed, stopping tests")
        return 1

    # Test 4: Get Current User
    if not tester.test_get_me()[0]:
        print("❌ Get current user failed")

    # Test 5: Class Management
    print("\n🏫 Testing Class Management...")
    if not tester.test_create_class()[0]:
        print("❌ Class creation failed")
    
    tester.test_get_classes()
    tester.test_get_teachers()
    
    # Test 6: Teacher Assignment
    print("\n👨‍🏫 Testing Teacher Assignment...")
    tester.test_assign_teacher()

    # Test 7: Student Management
    print("\n👨‍🎓 Testing Student Management...")
    tester.test_add_student()
    tester.test_get_students_by_class()

    # Test 8: Materials Management
    print("\n📚 Testing Materials Management...")
    tester.test_create_material()
    tester.test_get_materials_by_class()

    # Test 9: Attendance Management (requires teacher login)
    print("\n✅ Testing Attendance Management...")
    # Switch to teacher login for attendance
    if teacher_success:
        teacher_email = teacher_data['user']['email']
        teacher_login_success, _ = tester.test_login_institution(teacher_email, "TestPass123!")
        if teacher_login_success:
            tester.test_mark_attendance()
            tester.test_get_attendance()
        
        # Switch back to institution for messaging
        tester.test_login_institution(institution_email, "TestPass123!")

    # Test 10: Messaging
    print("\n💬 Testing Messaging...")
    tester.test_send_message()
    tester.test_get_messages()

    # Test 11: Logout
    print("\n🚪 Testing Logout...")
    tester.test_logout()

    # Print Results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())