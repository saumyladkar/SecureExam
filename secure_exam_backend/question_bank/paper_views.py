from pathlib import Path
import pymupdf
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from django.core.files.storage import default_storage

class PaperUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request):
        if request.user.role not in ["ADMIN", "SUPERADMIN"]:
            raise PermissionDenied("Admin only.")
        uploaded = request.FILES.get("file")
        if not uploaded or not uploaded.name.lower().endswith(".pdf"):
            return Response({"detail": "Upload a PDF file using field 'file'."}, status=400)
        if uploaded.size > 20 * 1024 * 1024:
            return Response({"detail": "PDF must be 20 MB or smaller."}, status=400)
        path = default_storage.save(f"question_papers/{uploaded.name}", uploaded)
        full_path = default_storage.path(path)
        doc = pymupdf.open(full_path)
        text = "\n".join(page.get_text() for page in doc)
        return Response({"message": "PDF uploaded and text extracted.",
                         "file": path, "pages": len(doc), "extracted_text": text[:50000]},
                        status=status.HTTP_201_CREATED)
