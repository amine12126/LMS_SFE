from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    ChangePasswordSerializer, 
    ProfileSerializer, 
    ConsultantListSerializer, 
    AdminUserSerializer, 
    TLDetailSerializer
)
from apps.authentication.permissions import IsTL, IsAdmin
from apps.authentication.models import User
from apps.courses.models import Course, CourseGroup


# =========================
# PROFILE VIEW
# =========================
class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = ProfileSerializer(request.user, context={"request": request})
        return Response(serializer.data)

    def put(self, request):
        user = request.user

        serializer = ProfileSerializer(user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # securite: empecher modification role & ggid meme si requete hackee
        serializer.save(role=user.role, ggid=user.ggid)
        return Response(serializer.data)


# =========================
# CHANGE PASSWORD VIEW
# =========================
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = request.user

        # verifier ancien mot de passe
        if not user.check_password(serializer.validated_data["old_password"]):
            return Response(
                {"detail": "Ancien mot de passe incorrect"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # changer mot de passe
        user.set_password(serializer.validated_data["new_password"])
        user.save()

        return Response({"detail": "Mot de passe mis a jour avec succes"})

# =========================
# CONSULTANTS LIST VIEW (TL & Admin)
# =========================
class ConsultantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin can see all, TL can see all for now (or later filter by group if needed)
        consultants = User.objects.filter(role="consultant", is_active=True).order_by("nom", "prenom")
        serializer = ConsultantListSerializer(consultants, many=True, context={"request": request})
        return Response(serializer.data)

# =========================
# TL LIST VIEW (Admin Only)
# =========================
class TLListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        tls = User.objects.filter(role="tl", is_active=True).order_by("nom", "prenom")
        serializer = TLDetailSerializer(tls, many=True, context={"request": request})
        return Response(serializer.data)

# =========================
# ADMIN USER MANAGEMENT (CRUD)
# =========================
class AdminUserManagementView(APIView):
    permission_classes = [IsAdmin]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = AdminUserSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur non trouve"}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = AdminUserSerializer(user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur non trouve"}, status=status.HTTP_404_NOT_FOUND)
        
        user.is_active = False # Soft delete or Hard delete? User asked for "supprimer"
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

# =========================
# TL DETAILS (Courses & Groups)
# =========================
class TLDetailView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            tl = User.objects.get(pk=pk, role="tl")
        except User.DoesNotExist:
            return Response({"detail": "TL non trouve"}, status=status.HTTP_404_NOT_FOUND)
        
        courses = Course.objects.filter(created_by=tl, is_deleted=False)
        groups = CourseGroup.objects.filter(created_by=tl)
        
        # We can create a quick response or use small serializers
        from apps.courses.serializers import CourseListSerializer, CourseGroupSerializer
        
        return Response({
            "tl": TLDetailSerializer(tl, context={"request": request}).data,
            "courses": CourseListSerializer(courses, many=True, context={"request": request}).data,
            "groups": CourseGroupSerializer(groups, many=True, context={"request": request}).data
        })

