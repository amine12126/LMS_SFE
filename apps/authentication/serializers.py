from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User


# ================= REGISTER =================
class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["email", "password", "nom", "prenom", "ggid", "niveau"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        # 🔥 ROLE FORCÉ ICI AUSSI (double sécurité)
        return User.objects.create_user(**validated_data, role="consultant")


# ================= LOGIN =================
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


# ================= USER =================
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ["password"]  # ⚠️ ne jamais exposer password
        read_only_fields = ("role", "is_staff", "is_superuser")  # 🔐 sécurité


# ================= ME (lecture profil authentifié) =================
class MeReadSerializer(serializers.ModelSerializer):
    has_face_registered = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["email", "role", "nom", "prenom", "ggid", "niveau", "profile_photo", "has_face_registered"]
        read_only_fields = fields

    def get_has_face_registered(self, obj):
        return hasattr(obj, 'userface')


# ================= FACE =================
class FaceSerializer(serializers.Serializer):
    embedding = serializers.ListField(
        child=serializers.FloatField(),
        min_length=128,
        max_length=128
    )


# ================= PASSWORD RESET FLOW =================
class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(help_text="L'adresse email du compte à réinitialiser.")


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(help_text="Le jeton de réinitialisation reçu par email.")
    password = serializers.CharField(help_text="Le nouveau mot de passe souhaité.")


