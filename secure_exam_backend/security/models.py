import uuid
from django.conf import settings
from django.db import models
from question_bank.models import Question

class AnswerKey(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.OneToOneField(Question, on_delete=models.PROTECT, related_name="answer_key")
    ciphertext = models.BinaryField()
    key_version = models.CharField(max_length=20, default="v1")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="answer_keys_created")
    updated_at = models.DateTimeField(auto_now=True)

class AnswerKeyAuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.PROTECT, related_name="answer_key_logs")
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    action = models.CharField(max_length=20)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
