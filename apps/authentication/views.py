from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.core.mail import send_mail
from django.conf import settings
from drf_spectacular.utils import extend_schema, OpenApiTypes

from .serializers import (
    LoginSerializer,
    MeReadSerializer,
    RegisterSerializer,
    FaceSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
)
from .models import User, PasswordResetToken, UserFace, FaceAccessLog
from .tokens import get_tokens
from django.core.files.base import ContentFile
from .services import base64_to_bytes, compare_faces
from .logs import get_client_ip



# ================= REGISTER =================
class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        # 🔒 Bloquer toute tentative d’envoi de role
        if "role" in request.data:
            return Response({"error": "Role non autorisé"}, status=400)

        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Role is forced in serializer.create_user() (double sécurité)
        serializer.save()

        return Response({"message": "Compte consultant créé"})


# ================= LOGIN =================
class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = authenticate(
            username=serializer.validated_data["email"],
            password=serializer.validated_data["password"],
        )

        if not user:
            return Response({"error": "Invalid credentials"}, status=401)

        if not user.is_active:
            return Response({"error": "Account disabled"}, status=403)

        return Response({"tokens": get_tokens(user), "role": user.role})


# ================= PROFILE =================
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: MeReadSerializer})
    def get(self, request):
        return Response(MeReadSerializer(request.user).data)


# ================= FORGOT PASSWORD =================
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=ForgotPasswordSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        email = request.data.get("email")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        PasswordResetToken.objects.filter(user=user).delete()
        reset_token = PasswordResetToken.objects.create(user=user)

        # ⚠️ à remplacer en production
        link = f"{settings.FRONTEND_URL}/reset-password/{reset_token.token}"

        send_mail(
            "Reset Password",
            f"Click here: {link}",
            settings.EMAIL_HOST_USER,
            [email],
        )

        return Response({"message": "Email envoyé"})


# ================= RESET PASSWORD =================
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=ResetPasswordSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        token = request.data.get("token")
        password = request.data.get("password")

        try:
            reset_token = PasswordResetToken.objects.get(token=token)
        except PasswordResetToken.DoesNotExist:
            return Response({"error": "Invalid token"}, status=400)

        if reset_token.is_expired():
            reset_token.delete()
            return Response({"error": "Token expired"}, status=400)

        user = reset_token.user
        user.set_password(password)
        user.save()

        reset_token.delete()

        return Response({"message": "Password updated"})


# ================= SAVE FACE =================
class SaveFaceView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=FaceSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = FaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        embedding = serializer.validated_data["embedding"]

        UserFace.objects.update_or_create(
            user=request.user,
            defaults={"embedding": embedding}
        )

        return Response({"message": "Face saved successfully"})


# ================= ACCESS GROUP =================
class AccessGroupView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=FaceSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request, group_id):
        serializer = FaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_embedding = serializer.validated_data["embedding"]

        user = request.user
        ip = get_client_ip(request)

        try:
            user_face = UserFace.objects.get(user=user)
        except UserFace.DoesNotExist:
            FaceAccessLog.objects.create(
                user=user,
                group_id=group_id,
                success=False,
                ip_address=ip
            )
            return Response({"error": "Face not registered"}, status=400)

        # Calculate Euclidean distance
        is_match = False
        if user_face.embedding and new_embedding:
            import math
            # L2 Euclidean distance
            distance = math.sqrt(sum((a - b) ** 2 for a, b in zip(user_face.embedding, new_embedding)))
            # face-api.js generally uses 0.5 or 0.6 as a threshold for ResNet50
            is_match = distance <= 0.55

        FaceAccessLog.objects.create(
            user=user,
            group_id=group_id,
            success=is_match,
            ip_address=ip
        )

        if not is_match:
            return Response({"error": "Face verification failed"}, status=403)

        return Response({
            "message": "Access granted",
            "group_id": group_id
        })

