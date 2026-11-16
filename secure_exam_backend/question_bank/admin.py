from django.contrib import admin
from .models import Question, QuestionOption
class OptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0
@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "subject", "question_type", "status", "created_at"]
    list_filter = ["question_type", "status", "subject"]
    inlines = [OptionInline]
