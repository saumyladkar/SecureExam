from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import QuestionViewSet
from .paper_views import PaperUploadView
router = DefaultRouter()
router.register("questions", QuestionViewSet)
urlpatterns = router.urls + [path("papers/upload/", PaperUploadView.as_view())]
