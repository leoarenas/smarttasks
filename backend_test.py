import requests
import sys
import json
from datetime import datetime

class SmartTasksAPITester:
    def __init__(self, base_url="https://smarttasks-15.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.is_admin = False
        self.tests_run = 0
        self.tests_passed = 0
        self.verification_token = None
        self.task_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
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
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        success, response = self.run_test(
            "Root API Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_config_status(self):
        """Test public config status endpoint"""
        success, response = self.run_test(
            "Config Status (Public)",
            "GET",
            "config/status",
            200
        )
        if success:
            print(f"   Email configured: {response.get('email_configured', False)}")
            print(f"   App name: {response.get('app_name', 'N/A')}")
        return success

    def test_register(self):
        """Test user registration"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={"email": test_email}
        )
        if success:
            self.user_id = response.get('user_id')
            self.is_admin = response.get('is_admin', False)
            # Extract verification token from link if in testing mode
            verification_link = response.get('verification_link')
            if verification_link:
                # Extract token from URL like /verify-email?token=xxx
                self.verification_token = verification_link.split('token=')[1]
                print(f"   Verification token: {self.verification_token[:20]}...")
                print(f"   Is admin: {self.is_admin}")
        return success

    def test_verify_email(self):
        """Test email verification with password setup"""
        if not self.verification_token:
            print("❌ No verification token available")
            return False
            
        success, response = self.run_test(
            "Email Verification",
            "POST",
            "auth/verify-email",
            200,
            data={
                "token": self.verification_token,
                "password": "TestPass123!"
            }
        )
        if success:
            self.token = response.get('token')
            user_data = response.get('user', {})
            self.user_id = user_data.get('id')
            self.is_admin = user_data.get('is_admin', False)
            print(f"   JWT token received: {self.token[:20]}...")
            print(f"   User ID: {self.user_id}")
            print(f"   Is admin: {self.is_admin}")
        return success

    def test_get_me(self):
        """Test get current user endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_task(self):
        """Test task creation"""
        task_data = {
            "name": "Revisión de contratos",
            "description": "Revisar y aprobar contratos de proveedores semanalmente",
            "frequency": "Semanal",
            "duration": "2 horas",
            "impact": 4,
            "risk": 3,
            "effort": 3,
            "confidentiality": "Media"
        }
        success, response = self.run_test(
            "Create Task",
            "POST",
            "tasks",
            200,
            data=task_data
        )
        if success:
            self.task_id = response.get('id')
            print(f"   Task ID: {self.task_id}")
        return success

    def test_get_tasks(self):
        """Test get all tasks"""
        success, response = self.run_test(
            "Get All Tasks",
            "GET",
            "tasks",
            200
        )
        if success:
            print(f"   Found {len(response)} tasks")
        return success

    def test_get_single_task(self):
        """Test get single task"""
        if not self.task_id:
            print("❌ No task ID available")
            return False
            
        success, response = self.run_test(
            "Get Single Task",
            "GET",
            f"tasks/{self.task_id}",
            200
        )
        return success

    def test_update_task(self):
        """Test task update"""
        if not self.task_id:
            print("❌ No task ID available")
            return False
            
        update_data = {
            "name": "Revisión de contratos (actualizada)",
            "impact": 5
        }
        success, response = self.run_test(
            "Update Task",
            "PUT",
            f"tasks/{self.task_id}",
            200,
            data=update_data
        )
        return success

    def test_analyze_task(self):
        """Test AI task analysis"""
        if not self.task_id:
            print("❌ No task ID available")
            return False
            
        print("   Note: AI analysis may take 10-15 seconds...")
        success, response = self.run_test(
            "Analyze Task with AI",
            "POST",
            f"tasks/{self.task_id}/analyze",
            200
        )
        if success:
            decision = response.get('decision')
            justification = response.get('decision_justification', '')
            print(f"   AI Decision: {decision}")
            print(f"   Justification: {justification[:100]}...")
        return success

    def test_analyze_all_tasks(self):
        """Test analyze all tasks"""
        print("   Note: Bulk AI analysis may take 15-30 seconds...")
        success, response = self.run_test(
            "Analyze All Tasks",
            "POST",
            "tasks/analyze-all",
            200
        )
        if success:
            total = response.get('total', 0)
            successful = response.get('success', 0)
            print(f"   Analyzed {successful}/{total} tasks")
        return success

    def test_get_report(self):
        """Test report generation"""
        success, response = self.run_test(
            "Get Report",
            "GET",
            "report",
            200
        )
        if success:
            stats = response.get('stats', {})
            print(f"   Total tasks: {stats.get('total', 0)}")
            print(f"   Analyzed: {stats.get('analyzed', 0)}")
            print(f"   Conservar: {stats.get('conservar', 0)}")
            print(f"   Delegar: {stats.get('delegar', 0)}")
            print(f"   Automatizar: {stats.get('automatizar', 0)}")
            print(f"   Eliminar: {stats.get('eliminar', 0)}")
        return success

    def test_admin_get_config(self):
        """Test admin config retrieval"""
        if not self.is_admin:
            print("⚠️  Skipping admin test - user is not admin")
            return True
            
        success, response = self.run_test(
            "Get Admin Config",
            "GET",
            "config",
            200
        )
        if success:
            print(f"   App name: {response.get('app_name', 'N/A')}")
            print(f"   Has API key: {bool(response.get('resend_api_key'))}")
            print(f"   Sender email: {response.get('sender_email', 'N/A')}")
        return success

    def test_admin_update_config(self):
        """Test admin config update"""
        if not self.is_admin:
            print("⚠️  Skipping admin test - user is not admin")
            return True
            
        config_data = {
            "app_name": "SmartTasks Test",
            "sender_email": "test@example.com"
        }
        success, response = self.run_test(
            "Update Admin Config",
            "PUT",
            "config",
            200,
            data=config_data
        )
        return success

    def test_delete_task(self):
        """Test task deletion"""
        if not self.task_id:
            print("❌ No task ID available")
            return False
            
        success, response = self.run_test(
            "Delete Task",
            "DELETE",
            f"tasks/{self.task_id}",
            200
        )
        return success

def main():
    print("🚀 Starting SmartTasks API Testing...")
    print("=" * 50)
    
    tester = SmartTasksAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Config Status", tester.test_config_status),
        ("User Registration", tester.test_register),
        ("Email Verification", tester.test_verify_email),
        ("Get Current User", tester.test_get_me),
        ("Create Task", tester.test_create_task),
        ("Get All Tasks", tester.test_get_tasks),
        ("Get Single Task", tester.test_get_single_task),
        ("Update Task", tester.test_update_task),
        ("AI Task Analysis", tester.test_analyze_task),
        ("AI Analyze All Tasks", tester.test_analyze_all_tasks),
        ("Get Report", tester.test_get_report),
        ("Admin Get Config", tester.test_admin_get_config),
        ("Admin Update Config", tester.test_admin_update_config),
        ("Delete Task", tester.test_delete_task),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())