from rest_framework.permissions import BasePermission


class IsTL(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "tl"


class IsConsultant(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user, "role", None) == "consultant"
