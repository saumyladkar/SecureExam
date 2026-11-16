from rest_framework import serializers
class AnswerKeyInputSerializer(serializers.Serializer):
    answer = serializers.JSONField()
    def validate_answer(self, value):
        if not isinstance(value, dict) or not value:
            raise serializers.ValidationError("Answer must be a non-empty JSON object.")
        return value
