from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AuditLog, Chapter, ChapterProgress, Content, Course, CourseGroup

User = get_user_model()


# ── Consultant (catalogue, lecture seule) ──
class ConsultantCourseBrowseSerializer(serializers.ModelSerializer):
    chapters_count = serializers.IntegerField(read_only=True)
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "description",
            "duration",
            "expiration_date",
            "image",
            "chapters_count",
            "created_at",
            "teacher_name",
            "is_mandatory",
        ]

    def get_teacher_name(self, obj):
        u = getattr(obj, "created_by", None)
        if not u:
            return ""
        return f"{u.prenom} {u.nom}".strip() or (u.email or "")


# 📦 CONTENT
class ContentSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Content
        fields = "__all__"

    def get_progress(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        progress = obj.progress.filter(user=request.user).first()
        if progress:
            return {
                "is_completed": progress.is_completed
            }
        return {"is_completed": False}


# 📖 CHAPTER
class ChapterSerializer(serializers.ModelSerializer):
    contents = ContentSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Chapter
        fields = "__all__"

    def get_progress(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        progress = obj.progress.filter(user=request.user).first()
        if progress:
            return {
                "is_viewed": progress.is_viewed,
                "is_completed": progress.is_completed
            }
        return {"is_viewed": False, "is_completed": False}


# 📚 COURSE
class CourseSerializer(serializers.ModelSerializer):
    chapters = ChapterSerializer(many=True, read_only=True)
    teacher_name = serializers.SerializerMethodField()
    teacher = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ["created_by", "is_deleted", "created_at"]

    def get_teacher_name(self, obj):
        u = getattr(obj, "created_by", None)
        if not u:
            return ""
        return f"{u.prenom} {u.nom}".strip() or (u.email or "")

    def get_teacher(self, obj):
        u = getattr(obj, "created_by", None)
        if not u:
            return None
        request = self.context.get("request")
        name = f"{u.prenom} {u.nom}".strip() or (u.email or "")
        photo = None
        if u.profile_photo:
            url = u.profile_photo.url
            photo = request.build_absolute_uri(url) if request else url
        return {
            "name": name,
            "prenom": u.prenom,
            "nom": u.nom,
            "email": u.email,
            "photo": photo,
            "bio": "",
        }


# 📊 AUDIT
class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = "__all__"


# 🏢 GROUP
class CourseGroupSerializer(serializers.ModelSerializer):
    consultants_count = serializers.IntegerField(source='consultants.count', read_only=True)
    assigned_courses = serializers.SerializerMethodField()
    team_leaders_info = serializers.SerializerMethodField()
    consultants_info = serializers.SerializerMethodField()

    class Meta:
        model = CourseGroup
        fields = [
            'id', 'name', 'created_by', 'team_leaders', 'team_leaders_info', 
            'consultants', 'consultants_info', 'consultants_count', 'created_at', 'assigned_courses'
        ]
        read_only_fields = ['created_by', 'created_at']
        
    def get_assigned_courses(self, obj):
        return [{"id": c.id, "title": c.title} for c in obj.courses.filter(is_deleted=False)]

    def get_team_leaders_info(self, obj):
        return [{"id": u.id, "nom": u.nom, "prenom": u.prenom, "email": u.email} for u in obj.team_leaders.all()]

    def get_consultants_info(self, obj):
        return [{"id": u.id, "nom": u.nom, "prenom": u.prenom, "email": u.email} for u in obj.consultants.all()]


# 📈 PROGRESS
class ChapterProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChapterProgress
        fields = ["id", "user", "chapter", "is_viewed", "is_completed", "viewed_at", "completed_at"]
        read_only_fields = ["user", "chapter", "viewed_at", "completed_at"]
class CourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ["id", "title", "description", "image", "duration", "expiration_date", "created_at", "is_mandatory"]
