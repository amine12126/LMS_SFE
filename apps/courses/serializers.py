from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import AuditLog, Chapter, ChapterProgress, Content, Course, CourseGroup, CoursePackage, PackageCourseExclusion

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
    chapters = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    teacher = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = "__all__"
        read_only_fields = ["created_by", "is_deleted", "created_at"]

    def get_chapters(self, obj):
        request = self.context.get("request")
        package_id = None
        if request and request.query_params.get("package_id"):
            try:
                package_id = int(request.query_params.get("package_id"))
            except ValueError:
                pass
        
        excluded_chapters = []
        excluded_contents = []
        if package_id:
            exclusion = PackageCourseExclusion.objects.filter(
                package_id=package_id, course_id=obj.id
            ).first()
            if exclusion:
                excluded_chapters = list(exclusion.excluded_chapters.values_list("id", flat=True))
                excluded_contents = list(exclusion.excluded_contents.values_list("id", flat=True))

        chapters_qs = obj.chapters.exclude(id__in=excluded_chapters).order_by('order')
        
        # Serialize the chapters
        serializer = ChapterSerializer(chapters_qs, many=True, context=self.context)
        data = serializer.data
        
        # Now filter the contents of each serialized chapter if there are excluded contents
        if excluded_contents:
            for chap in data:
                if 'contents' in chap:
                    chap['contents'] = [c for c in chap['contents'] if c['id'] not in excluded_contents]
                    
        return data

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
    assigned_packages = serializers.SerializerMethodField()
    team_leaders_info = serializers.SerializerMethodField()
    consultants_info = serializers.SerializerMethodField()

    class Meta:
        model = CourseGroup
        fields = [
            'id', 'name', 'created_by', 'team_leaders', 'team_leaders_info', 
            'consultants', 'consultants_info', 'consultants_count', 'created_at', 
            'assigned_courses', 'packages', 'assigned_packages'
        ]
        read_only_fields = ['created_by', 'created_at']
        
    def get_assigned_courses(self, obj):
        return [{"id": c.id, "title": c.title} for c in obj.courses.filter(is_deleted=False)]

    def get_assigned_packages(self, obj):
        request = self.context.get('request')
        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "courses": [
                    {
                        "id": c.id,
                        "title": c.title,
                        "image": request.build_absolute_uri(c.image.url) if c.image and request else (c.image.url if c.image else None)
                    }
                    for c in p.courses.filter(is_deleted=False)
                ]
            }
            for p in obj.packages.all()
        ]

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


# 🗂️ COURSE PACKAGE
class CoursePackageSerializer(serializers.ModelSerializer):
    courses_info = serializers.SerializerMethodField()

    class Meta:
        model = CoursePackage
        fields = ["id", "name", "description", "created_by", "courses", "created_at", "courses_info"]
        read_only_fields = ["created_by", "created_at"]

    def get_courses_info(self, obj):
        request = self.context.get('request')
        return [
            {
                "id": c.id, 
                "title": c.title, 
                "image": request.build_absolute_uri(c.image.url) if c.image and request else (c.image.url if c.image else None)
            } 
            for c in obj.courses.filter(is_deleted=False)
        ]


# ─────────────────────────────
# 🚫 PACKAGE COURSE EXCLUSION
# ─────────────────────────────
class PackageCourseExclusionSerializer(serializers.ModelSerializer):
    # On expose les IDs pour le frontend
    excluded_chapter_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Chapter.objects.all(), source='excluded_chapters', required=False
    )
    excluded_content_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Content.objects.all(), source='excluded_contents', required=False
    )
    # Vue complète du cours (chapitres + contenus) avec les exclusions marquées
    course_view = serializers.SerializerMethodField()

    class Meta:
        model = PackageCourseExclusion
        fields = [
            'id', 'package', 'course',
            'excluded_chapter_ids', 'excluded_content_ids',
            'course_view'
        ]
        read_only_fields = ['package', 'course', 'course_view']

    def get_course_view(self, obj):
        """Retourne les chapitres et contenus avec is_excluded marqué."""
        excluded_chap_ids = set(obj.excluded_chapters.values_list('id', flat=True))
        excluded_cont_ids = set(obj.excluded_contents.values_list('id', flat=True))
        chapters = []
        for chap in obj.course.chapters.order_by('order'):
            contents = []
            for cont in chap.contents.order_by('order'):
                contents.append({
                    'id': cont.id,
                    'type': cont.type,
                    'order': cont.order,
                    'file': cont.file.url if cont.file else None,
                    'url': cont.url,
                    'is_excluded': cont.id in excluded_cont_ids,
                })
            chapters.append({
                'id': chap.id,
                'title': chap.title,
                'order': chap.order,
                'is_excluded': chap.id in excluded_chap_ids,
                'contents': contents,
            })
        return {
            'id': obj.course.id,
            'title': obj.course.title,
            'chapters': chapters,
        }

