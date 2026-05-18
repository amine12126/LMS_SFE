from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.authentication.models import User


# =========================
# PROFILE SERIALIZER
# =========================
class ProfileSerializer(serializers.ModelSerializer):
    has_face_registered = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "email", "nom", "prenom", "ggid", "role", "profile_photo", "has_face_registered"]
        read_only_fields = ["ggid", "role", "has_face_registered"]  # securite entreprise

    def get_has_face_registered(self, obj):
        return hasattr(obj, 'userface')

class ConsultantListSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "nom", "prenom", "ggid", "profile_photo"]


# =========================
# CHANGE PASSWORD SERIALIZER
# =========================
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value

class AdminUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "email", "nom", "prenom", "ggid", "role", "profile_photo", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password", "Welcome123!") # Default password if not provided
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        if password:
            instance.set_password(password)
        return super().update(instance, validated_data)

class TLDetailSerializer(serializers.ModelSerializer):
    courses_count = serializers.IntegerField(source="courses.count", read_only=True)
    groups_count = serializers.IntegerField(source="created_course_groups.count", read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "email", "nom", "prenom", "ggid", "profile_photo", "courses_count", "groups_count"]
