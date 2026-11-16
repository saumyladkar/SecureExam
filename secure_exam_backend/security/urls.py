from django.urls import path
from .views import AnswerKeyView
urlpatterns = [path("questions/<uuid:question_id>/answer-key/", AnswerKeyView.as_view())]
