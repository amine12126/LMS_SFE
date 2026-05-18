from django.urls import path
from .views import (
    ChangePasswordView, 
    ProfileView, 
    ConsultantListView,
    TLListView,
    AdminUserManagementView,
    TLDetailView
)

urlpatterns = [
    path("profile/", ProfileView.as_view()),
    path("profile/change-password/", ChangePasswordView.as_view()),
    path("consultants/", ConsultantListView.as_view()),
    path("tls/", TLListView.as_view()),
    path("manage/", AdminUserManagementView.as_view()),
    path("manage/<int:pk>/", AdminUserManagementView.as_view()),
    path("tl-details/<int:pk>/", TLDetailView.as_view()),
]
