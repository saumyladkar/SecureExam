from rest_framework import serializers
from .models import Exam
class ExamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ["id", "subject", "title", "description", "duration_minutes", "total_questions",
                  "total_marks", "negative_marking", "shuffle_questions", "shuffle_options",
                  "start_time", "end_time", "max_attempts", "status", "questions", "created_at"]
        read_only_fields = ["id", "created_at", "created_by"]
    def validate(self, attrs):
        start = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end = attrs.get("end_time", getattr(self.instance, "end_time", None))
        if start and end and start >= end:
            raise serializers.ValidationError("End time must be after start time.")
        return attrs
