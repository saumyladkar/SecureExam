from rest_framework import serializers
from .models import Question, QuestionOption

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ["id", "label", "text", "order"]
        read_only_fields = ["id"]

class QuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, required=False)
    class Meta:
        model = Question
        fields = ["id", "subject", "text", "question_type", "marks", "explanation", "status", "options", "created_at"]
        read_only_fields = ["id", "status", "created_at"]
    def create(self, validated_data):
        options = validated_data.pop("options", [])
        question = Question.objects.create(**validated_data)
        for option in options:
            QuestionOption.objects.create(question=question, **option)
        return question
    def update(self, instance, validated_data):
        options = validated_data.pop("options", None)
        for key, value in validated_data.items(): setattr(instance, key, value)
        instance.save()
        if options is not None:
            instance.options.all().delete()
            for option in options: QuestionOption.objects.create(question=instance, **option)
        return instance

class StudentQuestionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    class Meta:
        model = Question
        fields = ["id", "subject", "text", "question_type", "marks", "options"]
