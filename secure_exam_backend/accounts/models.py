import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        ADMIN = "ADMIN", "Admin"
        SUPERADMIN = "SUPERADMIN", "Superadmin"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    student_id = models.CharField(max_length=30, unique=True, null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    def save(self, *args, **kwargs):
        if self.role == self.Role.STUDENT and not self.student_id:
            self.student_id = f"STU-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)
