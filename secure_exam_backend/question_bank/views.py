from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Question
from .serializers import QuestionSerializer

class QuestionViewSet(ModelViewSet):
    queryset = Question.objects.prefetch_related("options").all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.role == "STUDENT":
            return qs.filter(status=Question.Status.APPROVED)
        return qs
    def perform_create(self, serializer):
        if self.request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can create questions.")
        serializer.save(created_by=self.request.user)
    def perform_update(self, serializer):
        if self.request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can update questions.")
        serializer.save()
    def perform_destroy(self, instance):
        if self.request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can delete questions.")
        instance.delete()
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        if request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can approve questions.")
        question = self.get_object()
        question.status = Question.Status.APPROVED
        question.save(update_fields=["status"])
        return Response({"message": "Question approved."})
