import random
from datetime import timedelta
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from .models import Exam, ExamAttempt, AttemptQuestion, StudentAnswer
from .serializers import ExamSerializer
from question_bank.models import Question

def admin_only(user):
    return user.role in ["ADMIN", "SUPERADMIN"]

class ExamListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = Exam.objects.all().order_by("-created_at")
        if request.user.role == "STUDENT":
            qs = qs.filter(status="PUBLISHED")
        return Response(ExamSerializer(qs, many=True).data)
    def post(self, request):
        if not admin_only(request.user): raise PermissionDenied("Admin only.")
        s = ExamSerializer(data=request.data); s.is_valid(raise_exception=True)
        exam = s.save(created_by=request.user)
        return Response(ExamSerializer(exam).data, status=201)

class ExamPublishView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, exam_id):
        if not admin_only(request.user): raise PermissionDenied("Admin only.")
        exam = get_object_or_404(Exam, id=exam_id)
        if not exam.questions.exists():
            return Response({"detail": "Add questions before publishing."}, status=400)
        if exam.questions.filter(status=Question.Status.APPROVED).count() != exam.questions.count():
            return Response({"detail": "Only approved questions can be used."}, status=400)
        exam.status = Exam.Status.PUBLISHED; exam.save(update_fields=["status"])
        return Response({"message": "Exam published."})

class StartExamView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, exam_id):
        if request.user.role != "STUDENT": raise PermissionDenied("Student only.")
        exam = get_object_or_404(Exam, id=exam_id, status=Exam.Status.PUBLISHED)
        now = timezone.now()
        if now < exam.start_time or now > exam.end_time:
            return Response({"detail": "Exam is not currently available."}, status=400)
        if ExamAttempt.objects.filter(exam=exam, student=request.user).count() >= exam.max_attempts:
            return Response({"detail": "Maximum attempts reached."}, status=400)
        with transaction.atomic():
            questions = list(exam.questions.filter(status=Question.Status.APPROVED).prefetch_related("options"))
            if exam.shuffle_questions: random.shuffle(questions)
            questions = questions[:exam.total_questions]
            if not questions: return Response({"detail": "No questions available."}, status=400)
            expiry = min(now + timedelta(minutes=exam.duration_minutes), exam.end_time)
            attempt = ExamAttempt.objects.create(exam=exam, student=request.user, expires_at=expiry)
            for index, question in enumerate(questions):
                option_ids = list(question.options.values_list("id", flat=True))
                if exam.shuffle_options: random.shuffle(option_ids)
                AttemptQuestion.objects.create(attempt=attempt, question=question, order=index+1,
                                               option_order=[str(x) for x in option_ids])
        return Response({"attempt_id": str(attempt.id), "expires_at": expiry, "question_count": len(questions)}, status=201)

class AttemptDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id, student=request.user)
        if attempt.status != ExamAttempt.Status.IN_PROGRESS:
            return Response({"detail": "Attempt is not active."}, status=400)
        rows = []
        for aq in attempt.attempt_questions.select_related("question").prefetch_related("question__options"):
            q = aq.question
            opts = {str(o.id): {"id": str(o.id), "label": o.label, "text": o.text} for o in q.options.all()}
            rows.append({"question_id": str(q.id), "text": q.text, "type": q.question_type,
                         "marks": q.marks, "options": [opts[x] for x in aq.option_order if x in opts]})
        return Response({"attempt_id": str(attempt.id), "expires_at": attempt.expires_at, "questions": rows})

class SaveAnswerView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id, student=request.user)
        if attempt.status != "IN_PROGRESS": return Response({"detail": "Attempt closed."}, status=400)
        if timezone.now() >= attempt.expires_at: return Response({"detail": "Time expired."}, status=400)
        question_id = request.data.get("question_id")
        answer = request.data.get("answer")
        if not isinstance(answer, dict): return Response({"detail": "answer must be an object."}, status=400)
        aq = get_object_or_404(AttemptQuestion, attempt=attempt, question_id=question_id)
        StudentAnswer.objects.update_or_create(attempt=attempt, question=aq.question, defaults={"answer": answer})
        return Response({"message": "Answer saved."})

class SubmitExamView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, attempt_id):
        attempt = get_object_or_404(ExamAttempt, id=attempt_id, student=request.user)
        if attempt.status != "IN_PROGRESS": return Response({"detail": "Already submitted."}, status=400)
        from evaluation.services import grade_attempt
        score = grade_attempt(attempt)
        attempt.score = score
        attempt.status = ExamAttempt.Status.SUBMITTED
        attempt.submitted_at = timezone.now()
        attempt.save(update_fields=["score", "status", "submitted_at"])
        return Response({"message": "Exam submitted.", "score": score})

class ResultsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = ExamAttempt.objects.filter(student=request.user) if request.user.role == "STUDENT" else ExamAttempt.objects.all()
        return Response([{"attempt_id": str(a.id), "exam": a.exam.title, "student": a.student.username,
                          "status": a.status, "score": a.score, "submitted_at": a.submitted_at} for a in qs.order_by("-started_at")])
