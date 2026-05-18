from django.urls import path
from .views import *

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("profile/", ProfileView.as_view()),
    path("forgot-password/", ForgotPasswordView.as_view()),
    path("reset-password/", ResetPasswordView.as_view()),
    path("save-face/", SaveFaceView.as_view()),
    path("access-group/<int:group_id>/", AccessGroupView.as_view()),
]
