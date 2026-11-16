from django.contrib import admin
from .models import AnswerKey, AnswerKeyAuditLog
admin.site.register(AnswerKey)
admin.site.register(AnswerKeyAuditLog)
