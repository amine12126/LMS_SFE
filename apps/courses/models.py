from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

User = settings.AUTH_USER_MODEL

# ─────────────────────────────
# 🏢 COURSE GROUP
# ─────────────────────────────
class CourseGroup(models.Model):
    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_course_groups")
    team_leaders = models.ManyToManyField(User, related_name="managed_groups", blank=True)
    consultants = models.ManyToManyField(User, related_name="course_groups", blank=True)
    packages = models.ManyToManyField("CoursePackage", related_name="groups", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name



# ─────────────────────────────
# 📚 COURSE
# ─────────────────────────────
class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    image = models.ImageField(upload_to="courses/", null=True, blank=True)
    duration = models.CharField(max_length=50)
    expiration_date = models.DateField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="courses")

    # Visibility
    is_public = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=False)
    groups = models.ManyToManyField(CourseGroup, related_name="courses", blank=True)

    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


# ─────────────────────────────
# 🗂️ COURSE PACKAGE
# ─────────────────────────────
class CoursePackage(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="created_packages")
    courses = models.ManyToManyField(Course, related_name="packages", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ─────────────────────────────
# 🚫 PACKAGE COURSE EXCLUSION
# Stocke uniquement les chapitres/contenus MASQUÉS dans un package
# Le cours original n'est pas touché
# ─────────────────────────────
class PackageCourseExclusion(models.Model):
    package         = models.ForeignKey(CoursePackage, on_delete=models.CASCADE, related_name="exclusions")
    course          = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="exclusions")
    excluded_chapters = models.ManyToManyField("Chapter", related_name="exclusions_as_chapter", blank=True)
    excluded_contents = models.ManyToManyField("Content", related_name="exclusions_as_content", blank=True)

    class Meta:
        unique_together = ("package", "course")

    def __str__(self):
        return f"Exclusion: {self.package.name} / {self.course.title}"



# ─────────────────────────────
# 📖 CHAPTER
# ─────────────────────────────
class Chapter(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="chapters")

    title = models.CharField(max_length=255)
    description = models.TextField(default="", blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]  # tri automatique

    def __str__(self):
        return f"{self.course.title} - {self.title}"


# ─────────────────────────────
# 📦 CONTENT
# ─────────────────────────────
class Content(models.Model):
    class Type(models.TextChoices):
        IMAGE = "image"
        PDF = "pdf"
        VIDEO = "video"
        LINK = "link"

    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="contents")
    order = models.PositiveIntegerField(default=0)

    type = models.CharField(max_length=10, choices=Type.choices)
    file = models.FileField(upload_to="contents/", null=True, blank=True)
    url = models.URLField(null=True, blank=True)

    class Meta:
        ordering = ["order", "id"]

    def clean(self):
        if self.type == "link" and not self.url:
            raise ValidationError("URL requise")
        if self.type != "link" and not self.file:
            raise ValidationError("Fichier requis")

    def save(self, *args, **kwargs):
        self.clean()  # force validation
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.chapter.title} - {self.type}"


# ─────────────────────────────
# 📊 AUDIT LOG
# ─────────────────────────────
class AuditLog(models.Model):
    ACTIONS = (
        ("CREATE", "CREATE"),
        ("UPDATE", "UPDATE"),
        ("DELETE", "DELETE"),
        ("REORDER", "REORDER"),
        ("REPLACE", "REPLACE"),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTIONS)

    model_name = models.CharField(max_length=50)
    object_id = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} - {self.model_name}"


# ─────────────────────────────
# 📈 CHAPTER PROGRESS
# ─────────────────────────────
class ChapterProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="progress")
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name="progress")

    is_viewed = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)

    viewed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "chapter")

    def mark_viewed(self):
        if not self.is_viewed:
            self.is_viewed = True
            self.viewed_at = timezone.now()
            self.save()

    def mark_completed(self):
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()

    def __str__(self):
        return f"{self.user} - {self.chapter} - {'Completed' if self.is_completed else 'Viewed'}"


# ─────────────────────────────
# 📈 CONTENT PROGRESS
# ─────────────────────────────
class ContentProgress(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="content_progress")
    content = models.ForeignKey(Content, on_delete=models.CASCADE, related_name="progress")

    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("user", "content")

    def mark_completed(self):
        if not self.is_completed:
            self.is_completed = True
            self.completed_at = timezone.now()
            self.save()

    def __str__(self):
        return f"{self.user} - {self.content} - {'Completed' if self.is_completed else 'Pending'}"

