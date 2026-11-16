import uuid
from django.conf import settings
from django.db import models
from subjects.models import Subject

class Question(models.Model):
    class Type(models.TextChoices):
        MCQ = "MCQ", "Multiple choice"
        MULTI_SELECT = "MULTI_SELECT", "Multiple select"
        TRUE_FALSE = "TRUE_FALSE", "True/False"
        SHORT_ANSWER = "SHORT_ANSWER", "Short answer"
        DESCRIPTIVE = "DESCRIPTIVE", "Descriptive"
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subject = models.ForeignKey(Subject, on_delete=models.PROTECT, related_name="questions")
    text = models.TextField()
    question_type = models.CharField(max_length=20, choices=Type.choices, default=Type.MCQ)
    marks = models.DecimalField(max_digits=7, decimal_places=2, default=1)
    explanation = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self): return self.text[:80]

class QuestionOption(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="options")
    label = models.CharField(max_length=5)
    text = models.CharField(max_length=500)
    order = models.PositiveSmallIntegerField(default=0)
    class Meta:
        ordering = ["order"]
        unique_together = [("question", "label")]
