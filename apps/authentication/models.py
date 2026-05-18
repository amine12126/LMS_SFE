from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
import uuid
from django.utils import timezone
from datetime import timedelta


# ================= USER MANAGER =================
class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra):
        if not email:
            raise ValueError("Email obligatoire")

        email = self.normalize_email(email)
        user = self.model(email=email, **extra)
        user.set_password(password)  # 🔐 hash password
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "admin")

        return self.create_user(email, password, **extra)


# ================= USER MODEL =================
class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        ADMIN = "admin"
        TL = "tl"
        CONSULTANT = "consultant"

    email = models.EmailField(unique=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    ggid = models.CharField(max_length=50, unique=True)

    role = models.CharField(max_length=20, choices=Role.choices)
    niveau = models.CharField(max_length=50, default="", blank=True)

    profile_photo = models.ImageField(upload_to="profiles/", null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom", "ggid"]  # ⚠️ important pour createsuperuser

    objects = UserManager()

    def __str__(self):
        return self.email  # 💡 utile dans admin


# ================= PASSWORD RESET =================
class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        return self.created_at < timezone.now() - timedelta(minutes=15)


# ================= FACE VERIFICATION =================
class UserFace(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    embedding = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)


class FaceAccessLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    group_id = models.IntegerField()
    success = models.BooleanField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

