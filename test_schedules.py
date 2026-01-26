"""
Comprehensive Test Suite for Schedule Management System
Tests cover: schedule creation, recurrence logic, teacher/subject assignment,
CRUD operations, and edge cases
"""

import pytest
import requests
from datetime import datetime, timedelta
import os

BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:8001')
BASE_API = f"{BACKEND_URL}/api"

# Test data will be populated during test execution
test_data = {
    'institution_token': None,
    'teacher_token': None,
    'institution_id': None,
    'teacher_id': None,
    'class_id': None,
    'subject_id': None,
    'assignment_id': None,
    'schedules': []
}


class TestAuthSetup:
    """Setup: Create test users and authenticate"""
    
    def test_01_register_institution(self):
        """Test institution registration"""
        response = requests.post(f"{BASE_API}/auth/register", json={
            "email": f"inst_schedule_test_{datetime.now().timestamp()}@test.com",
            "password": "test123",
            "name": "Test Institution Schedule",
            "user_type": "institution"
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        test_data['institution_token'] = data['token']
        test_data['institution_id'] = data['user']['user_id']
        print(f"✓ Institution registered: {test_data['institution_id']}")
    
    def test_02_register_teacher(self):
        """Test teacher registration"""
        response = requests.post(f"{BASE_API}/auth/register", json={
            "email": f"teacher_schedule_test_{datetime.now().timestamp()}@test.com",
            "password": "test123",
            "name": "Test Teacher Schedule",
            "user_type": "teacher"
        })
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        test_data['teacher_token'] = data['token']
        test_data['teacher_id'] = data['user']['user_id']
        print(f"✓ Teacher registered: {test_data['teacher_id']}")


class TestDataSetup:
    """Setup: Create class, subject, and assignment"""
    
    def test_03_create_subject(self):
        """Test subject creation"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        response = requests.post(f"{BASE_API}/subjects", 
            headers=headers,
            json={
                "name": "Matemática Avançada",
                "description": "Curso de matemática avançada"
            }
        )
        assert response.status_code == 200
        data = response.json()
        test_data['subject_id'] = data['subject_id']
        print(f"✓ Subject created: {test_data['subject_id']}")
    
    def test_04_create_class(self):
        """Test class creation"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        response = requests.post(f"{BASE_API}/classes",
            headers=headers,
            json={
                "name": "8º Ano A - Schedule Test",
                "description": "Turma de teste para horários"
            }
        )
        assert response.status_code == 200
        data = response.json()
        test_data['class_id'] = data['class_id']
        print(f"✓ Class created: {test_data['class_id']}")
    
    def test_05_assign_teacher(self):
        """Test teacher assignment to class with subject"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        response = requests.post(f"{BASE_API}/teacher-assignments",
            headers=headers,
            json={
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "class_id": test_data['class_id']
            }
        )
        assert response.status_code == 200
        print(f"✓ Teacher assigned to class with subject")
    
    def test_06_get_class_teachers(self):
        """Test fetching teachers for a class"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        response = requests.get(f"{BASE_API}/classes/{test_data['class_id']}/teachers",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        assert data[0]['teacher_id'] == test_data['teacher_id']
        assert data[0]['subject_id'] == test_data['subject_id']
        print(f"✓ Retrieved {len(data)} teacher(s) for class")


class TestScheduleCreation:
    """Test schedule creation with different recurrence types"""
    
    def test_07_create_schedule_once(self):
        """Test creating a one-time schedule"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Segunda",
                "time": "08:00",
                "duration": 60,
                "recurrence_type": "once",
                "start_date": today
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'schedule_id' in data
        assert data['recurrence_type'] == 'once'
        assert data['start_date'] == data['end_date']  # Same date for 'once'
        test_data['schedules'].append(data['schedule_id'])
        print(f"✓ Created one-time schedule: {data['schedule_id']}")
    
    def test_08_create_schedule_weekly(self):
        """Test creating a weekly recurring schedule"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Terça",
                "time": "10:00",
                "duration": 90,
                "recurrence_type": "weekly",
                "start_date": today
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['recurrence_type'] == 'weekly'
        # End date should be end of year
        assert data['end_date'] > data['start_date']
        test_data['schedules'].append(data['schedule_id'])
        print(f"✓ Created weekly schedule: {data['schedule_id']}")
    
    def test_09_create_schedule_semester_1(self):
        """Test creating a first semester schedule (Jan-Jun)"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        jan_date = f"{datetime.now().year}-01-15"
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Quarta",
                "time": "14:00",
                "duration": 60,
                "recurrence_type": "semester_1",
                "start_date": jan_date
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['recurrence_type'] == 'semester_1'
        # End date should be June 30
        assert data['end_date'].endswith('-06-30')
        test_data['schedules'].append(data['schedule_id'])
        print(f"✓ Created semester 1 schedule: {data['schedule_id']}")
    
    def test_10_create_schedule_semester_2(self):
        """Test creating a second semester schedule (Jul-Dec)"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        jul_date = f"{datetime.now().year}-07-15"
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Quinta",
                "time": "16:00",
                "duration": 60,
                "recurrence_type": "semester_2",
                "start_date": jul_date
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['recurrence_type'] == 'semester_2'
        # End date should be December 31
        assert data['end_date'].endswith('-12-31')
        test_data['schedules'].append(data['schedule_id'])
        print(f"✓ Created semester 2 schedule: {data['schedule_id']}")
    
    def test_11_create_schedule_annual(self):
        """Test creating an annual schedule"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Sexta",
                "time": "09:00",
                "duration": 120,
                "recurrence_type": "annual",
                "start_date": today
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['recurrence_type'] == 'annual'
        assert data['end_date'].endswith('-12-31')
        test_data['schedules'].append(data['schedule_id'])
        print(f"✓ Created annual schedule: {data['schedule_id']}")


class TestScheduleRetrieval:
    """Test schedule retrieval and filtering"""
    
    def test_12_get_all_schedules(self):
        """Test fetching all schedules for a class"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        response = requests.get(f"{BASE_API}/schedules/class/{test_data['class_id']}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # We created 5 schedules
        
        # Verify all schedules have required fields
        for schedule in data:
            assert 'schedule_id' in schedule
            assert 'teacher_name' in schedule
            assert 'subject_name' in schedule
            assert 'day_of_week' in schedule
            assert 'time' in schedule
            assert 'duration' in schedule
            assert 'recurrence_type' in schedule
        
        print(f"✓ Retrieved {len(data)} schedule(s)")
    
    def test_13_schedules_by_day(self):
        """Test filtering schedules by day of week"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        response = requests.get(f"{BASE_API}/schedules/class/{test_data['class_id']}",
            headers=headers
        )
        data = response.json()
        
        # Group by day
        days = {}
        for schedule in data:
            day = schedule['day_of_week']
            if day not in days:
                days[day] = []
            days[day].append(schedule)
        
        print(f"✓ Schedules grouped by day: {list(days.keys())}")


class TestSchedulePermissions:
    """Test authorization and permissions for schedules"""
    
    def test_14_teacher_can_view_schedules(self):
        """Test that teacher can view schedules"""
        headers = {'Authorization': f"Bearer {test_data['teacher_token']}"}
        response = requests.get(f"{BASE_API}/schedules/class/{test_data['class_id']}",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        print(f"✓ Teacher can view schedules")
    
    def test_15_teacher_can_create_schedule(self):
        """Test that teacher can create schedule for their class"""
        headers = {'Authorization': f"Bearer {test_data['teacher_token']}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Sábado",
                "time": "11:00",
                "duration": 60,
                "recurrence_type": "monthly",
                "start_date": today
            }
        )
        assert response.status_code == 200
        test_data['schedules'].append(response.json()['schedule_id'])
        print(f"✓ Teacher can create schedule")


class TestScheduleDeletion:
    """Test schedule deletion"""
    
    def test_16_delete_schedule_by_institution(self):
        """Test that institution can delete schedules"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        schedule_id = test_data['schedules'][0]
        
        response = requests.delete(f"{BASE_API}/schedules/{schedule_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Institution deleted schedule: {schedule_id}")
    
    def test_17_delete_schedule_by_teacher(self):
        """Test that teacher can delete their own schedules"""
        headers = {'Authorization': f"Bearer {test_data['teacher_token']}"}
        schedule_id = test_data['schedules'][-1]  # Last one was created by teacher
        
        response = requests.delete(f"{BASE_API}/schedules/{schedule_id}",
            headers=headers
        )
        assert response.status_code == 200
        print(f"✓ Teacher deleted own schedule: {schedule_id}")


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_18_create_schedule_without_teacher(self):
        """Test creating schedule without teacher ID should fail"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Segunda",
                "time": "08:00",
                "duration": 60,
                "recurrence_type": "weekly",
                "start_date": today
            }
        )
        assert response.status_code == 422  # Validation error
        print(f"✓ Properly rejected schedule without teacher")
    
    def test_19_create_schedule_invalid_class(self):
        """Test creating schedule for non-existent class"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        today = datetime.now().strftime('%Y-%m-%d')
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": "invalid_class_id",
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Segunda",
                "time": "08:00",
                "duration": 60,
                "recurrence_type": "weekly",
                "start_date": today
            }
        )
        assert response.status_code == 404
        print(f"✓ Properly rejected schedule for invalid class")
    
    def test_20_get_schedules_empty_class(self):
        """Test getting schedules for class with no schedules"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        
        # Create new empty class
        response = requests.post(f"{BASE_API}/classes",
            headers=headers,
            json={"name": "Empty Class", "description": "No schedules"}
        )
        empty_class_id = response.json()['class_id']
        
        # Get schedules
        response = requests.get(f"{BASE_API}/schedules/class/{empty_class_id}",
            headers=headers
        )
        assert response.status_code == 200
        assert len(response.json()) == 0
        print(f"✓ Empty schedule list returned correctly")


class TestRecurrenceLogic:
    """Test recurrence calculation logic"""
    
    def test_21_semester_1_date_calculation(self):
        """Verify semester 1 ends on June 30"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        jan_date = f"{datetime.now().year}-01-01"
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Segunda",
                "time": "08:00",
                "duration": 60,
                "recurrence_type": "semester_1",
                "start_date": jan_date
            }
        )
        data = response.json()
        end_date = datetime.fromisoformat(data['end_date'])
        assert end_date.month == 6
        assert end_date.day == 30
        print(f"✓ Semester 1 correctly ends on {data['end_date']}")
    
    def test_22_semester_2_date_calculation(self):
        """Verify semester 2 ends on December 31"""
        headers = {'Authorization': f"Bearer {test_data['institution_token']}"}
        jul_date = f"{datetime.now().year}-07-01"
        
        response = requests.post(f"{BASE_API}/schedules",
            headers=headers,
            json={
                "class_id": test_data['class_id'],
                "teacher_id": test_data['teacher_id'],
                "subject_id": test_data['subject_id'],
                "day_of_week": "Segunda",
                "time": "08:00",
                "duration": 60,
                "recurrence_type": "semester_2",
                "start_date": jul_date
            }
        )
        data = response.json()
        end_date = datetime.fromisoformat(data['end_date'])
        assert end_date.month == 12
        assert end_date.day == 31
        print(f"✓ Semester 2 correctly ends on {data['end_date']}")


def run_tests():
    """Run all tests in order"""
    print("\n" + "="*80)
    print("SCHEDULE MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE")
    print("="*80 + "\n")
    
    test_classes = [
        TestAuthSetup,
        TestDataSetup,
        TestScheduleCreation,
        TestScheduleRetrieval,
        TestSchedulePermissions,
        TestScheduleDeletion,
        TestEdgeCases,
        TestRecurrenceLogic
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for test_class in test_classes:
        print(f"\n{test_class.__name__}")
        print("-" * 80)
        
        test_methods = [method for method in dir(test_class) if method.startswith('test_')]
        for method_name in sorted(test_methods):
            total_tests += 1
            try:
                method = getattr(test_class(), method_name)
                method()
                passed_tests += 1
            except Exception as e:
                failed_tests += 1
                print(f"✗ {method_name} FAILED: {str(e)}")
    
    print("\n" + "="*80)
    print(f"TEST RESULTS: {passed_tests}/{total_tests} passed ({failed_tests} failed)")
    print("="*80 + "\n")
    
    return passed_tests == total_tests


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
