from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import PasswordResetToken, User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("email", "nom", "prenom", "ggid", "role", "niveau", "profile_photo")


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = ("email", "nom", "prenom", "ggid", "role", "niveau", "profile_photo", "is_active", "is_staff", "is_superuser")


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User

    ordering = ("email",)
    list_display = ("email", "nom", "prenom", "ggid", "role", "niveau", "is_active", "is_staff")
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "nom", "prenom", "ggid")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Infos", {"fields": ("nom", "prenom", "ggid", "role", "niveau", "profile_photo")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "nom",
                    "prenom",
                    "ggid",
                    "role",
                    "niveau",
                    "profile_photo",
                    "password1",
                    "password2",
                    "is_staff",
                    "is_superuser",
                    "is_active",
                ),
            },
        ),
    )
    filter_horizontal = ("groups", "user_permissions")


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "created_at"]
    search_fields = ["user__email"]
