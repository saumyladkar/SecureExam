from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from question_bank.models import Question
from .models import AnswerKey, AnswerKeyAuditLog
from .serializers import AnswerKeyInputSerializer
from .encryption import encrypt_answer_key

class AnswerKeyView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, question_id):
        if request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can manage answer keys.")
        question = get_object_or_404(Question, id=question_id)
        if question.status != Question.Status.APPROVED:
            return Response({"detail": "Approve the question before adding its answer key."}, status=400)
        serializer = AnswerKeyInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            key, created = AnswerKey.objects.get_or_create(
                question=question,
                defaults={"ciphertext": encrypt_answer_key(serializer.validated_data["answer"]),
                          "key_version": settings.ANSWER_KEY_KEY_VERSION,
                          "created_by": request.user}
            )
            if not created:
                return Response({"detail": "Answer key already exists. Use PUT."}, status=409)
            AnswerKeyAuditLog.objects.create(question=question, actor=request.user,
                action="CREATED", ip_address=request.META.get("REMOTE_ADDR"))
        return Response({"message": "Encrypted answer key created.", "question_id": str(question.id)},
                        status=status.HTTP_201_CREATED)
    def put(self, request, question_id):
        if request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can manage answer keys.")
        question = get_object_or_404(Question, id=question_id)
        key = get_object_or_404(AnswerKey, question=question)
        serializer = AnswerKeyInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            key.ciphertext = encrypt_answer_key(serializer.validated_data["answer"])
            key.key_version = settings.ANSWER_KEY_KEY_VERSION
            key.created_by = request.user
            key.save(update_fields=["ciphertext", "key_version", "created_by", "updated_at"])
            AnswerKeyAuditLog.objects.create(question=question, actor=request.user,
                action="REPLACED", ip_address=request.META.get("REMOTE_ADDR"))
        return Response({"message": "Encrypted answer key replaced."})
