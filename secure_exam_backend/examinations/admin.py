from django.contrib import admin
from .models import Exam, ExamAttempt, AttemptQuestion, StudentAnswer
admin.site.register(Exam)
admin.site.register(ExamAttempt)
admin.site.register(AttemptQuestion)
admin.site.register(StudentAnswer)
