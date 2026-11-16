from django.urls import path
from .views import (ExamListCreateView, ExamPublishView, StartExamView,
                    AttemptDetailView, SaveAnswerView, SubmitExamView, ResultsView)
urlpatterns = [
    path("exams/", ExamListCreateView.as_view()),
    path("exams/<uuid:exam_id>/publish/", ExamPublishView.as_view()),
    path("exams/<uuid:exam_id>/start/", StartExamView.as_view()),
    path("attempts/<uuid:attempt_id>/", AttemptDetailView.as_view()),
    path("attempts/<uuid:attempt_id>/answers/", SaveAnswerView.as_view()),
    path("attempts/<uuid:attempt_id>/submit/", SubmitExamView.as_view()),
    path("results/", ResultsView.as_view()),
]
