from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class IsTL(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "tl"


class IsConsultant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "consultant"


# 💡 BONUS PRO
class IsAdminOrTL(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ["admin", "tl"]
