from django.test import TestCase
from .models import User
class UserTests(TestCase):
    def test_student_gets_student_id(self):
        user = User.objects.create_user(username="sample", password="StrongPass123")
        self.assertTrue(user.student_id.startswith("STU-"))
        self.assertEqual(user.role, User.Role.STUDENT)
