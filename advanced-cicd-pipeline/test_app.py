import unittest
from app import app

class BasicTests(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_home(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"Advanced CI/CD Pipeline Deployed Successfully!", response.data)

if __name__ == '__main__':
    unittest.main()
