from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Subject
from .serializers import SubjectSerializer

class SubjectViewSet(ModelViewSet):
    queryset = Subject.objects.all().order_by("name")
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]
    def perform_create(self, serializer):
        if self.request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can create subjects.")
        serializer.save()
    def perform_update(self, serializer):
        if self.request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can update subjects.")
        serializer.save()
    def perform_destroy(self, instance):
        if self.request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Only admins can delete subjects.")
        instance.delete()
