urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/v1/accounts/", include("accounts.urls")),

    path("api/v1/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),

    path("api/v1/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    path("api/v1/", include("subjects.urls")),
    path("api/v1/", include("question_bank.urls")),
    path("api/v1/", include("security.urls")),
    path("api/v1/", include("examinations.urls")),
    path("api/v1/", include("evaluation.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)