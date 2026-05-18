from django.contrib import admin
from .models import AuditLog, Chapter, Content, Course


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "duration", "expiration_date", "is_deleted", "created_at")
    list_filter = ("is_deleted", "created_at", "expiration_date")
    search_fields = ("title", "description", "created_by__email")


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ("title", "course", "order")
    list_filter = ("course",)
    search_fields = ("title", "course__title")
    ordering = ("course", "order")


@admin.register(Content)
class ContentAdmin(admin.ModelAdmin):
    list_display = ("chapter", "order", "type")
    list_filter = ("type",)
    ordering = ("chapter", "order", "id")
    search_fields = ("chapter__title", "chapter__course__title")


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("user", "action", "model_name", "object_id", "created_at")
    list_filter = ("action", "model_name", "created_at")
    search_fields = ("user__email", "description")
