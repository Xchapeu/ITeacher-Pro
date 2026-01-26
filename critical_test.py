import requests
import sys
import json
from datetime import datetime

class CriticalIssuesTester:
    def __init__(self, base_url="https://classforge-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

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
                print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_institution_user(self):
        """Test login with provided institution credentials"""
        success, response = self.run_test(
            "Login Institution User (instituicao@test.com)",
            "POST",
            "auth/login",
            200,
            data={
                "email": "instituicao@test.com",
                "password": "test123"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
            print(f"   User type: {response['user']['user_type']}")
        return success, response

    def test_login_teacher_user(self):
        """Test login with provided teacher credentials"""
        success, response = self.run_test(
            "Login Teacher User (professor@test.com)",
            "POST",
            "auth/login",
            200,
            data={
                "email": "professor@test.com",
                "password": "test123"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Token received: {self.token[:20]}...")
            print(f"   User type: {response['user']['user_type']}")
        return success, response

    def test_get_classes_critical(self):
        """Test getting classes - this is the critical 520 error endpoint"""
        success, response = self.run_test(
            "Get Classes (Critical 520 Error Test)",
            "GET",
            "classes",
            200
        )
        if success:
            print(f"   Classes found: {len(response) if isinstance(response, list) else 'N/A'}")
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

def main():
    print("🚨 Testing Critical Issues - JWT Login & Class Loading...")
    print("=" * 70)
    
    tester = CriticalIssuesTester()
    
    # Test 1: Login with institution user
    print("\n🔐 Testing Institution Login (Critical Issue #1)...")
    institution_success, institution_data = tester.test_login_institution_user()
    
    if institution_success:
        # Test get current user
        tester.test_get_me()
        
        # Test class loading (Critical Issue #2)
        print("\n🏫 Testing Class Loading (Critical Issue #2)...")
        tester.test_get_classes_critical()
    
    # Reset token and test teacher login
    tester.token = None
    print("\n🔐 Testing Teacher Login (Critical Issue #1)...")
    teacher_success, teacher_data = tester.test_login_teacher_user()
    
    if teacher_success:
        # Test get current user
        tester.test_get_me()
        
        # Test class loading for teacher
        print("\n🏫 Testing Teacher Class Loading...")
        tester.test_get_classes_critical()

    # Print Results
    print("\n" + "=" * 70)
    print(f"📊 Critical Test Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All critical tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} critical tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())