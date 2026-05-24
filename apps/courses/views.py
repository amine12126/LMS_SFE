from django.contrib.auth import get_user_model
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Count, Max, Q
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Chapter, Content, Course, CourseGroup, ChapterProgress, ContentProgress, CoursePackage, PackageCourseExclusion
from .permissions import IsConsultant, IsTL
from apps.authentication.permissions import IsAdminOrTL, IsAdmin
from .serializers import (
    ChapterSerializer,
    ConsultantCourseBrowseSerializer,
    ContentSerializer,
    CourseSerializer,
    CourseGroupSerializer,
    CoursePackageSerializer,
    PackageCourseExclusionSerializer,
)
from .utils import log_action

User = get_user_model()


# ─────────────────────────────
# 📚 COURSE
# ─────────────────────────────
class CourseListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def get_queryset(self):
        return Course.objects.filter(created_by=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        import traceback
        try:
            group_id = self.request.data.get("group_id")
            
            # S'il y a un group_id, le cours devient privé, sinon il est public par défaut
            is_public = False if group_id else True
            
            obj = serializer.save(created_by=self.request.user, is_public=is_public)
            
            if group_id:
                try:
                    group = CourseGroup.objects.get(
                        Q(pk=group_id) & (Q(created_by=self.request.user) | Q(team_leaders=self.request.user))
                    )
                    obj.groups.add(group)
                except ObjectDoesNotExist:
                    pass

            log_action(self.request.user, "CREATE", obj)
        except Exception as e:
            traceback.print_exc()
            raise e


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def get_queryset(self):
        return Course.objects.filter(created_by=self.request.user)

    def perform_update(self, serializer):
        obj = serializer.save()
        log_action(self.request.user, "UPDATE", obj)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()
        log_action(self.request.user, "DELETE", instance)


# ─────────────────────────────
# 📚 CONSULTANT — catalogue cours (lecture)
# ─────────────────────────────
class ConsultantCourseBrowseView(generics.ListAPIView):
    serializer_class = ConsultantCourseBrowseSerializer
    permission_classes = [IsAuthenticated, IsConsultant]

    def get_queryset(self):
        return (
            Course.objects.filter(is_deleted=False, is_public=True)
            .select_related("created_by")
            .annotate(chapters_count=Count("chapters"))
            .order_by("-created_at")
        )


class ConsultantCourseRetrieveView(generics.RetrieveAPIView):
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticated, IsConsultant]

    def get_queryset(self):
        user = self.request.user
        return Course.objects.filter(
            Q(is_public=True) | Q(groups__consultants=user),
            is_deleted=False
        ).select_related("created_by").prefetch_related("chapters__contents").distinct()


# ─────────────────────────────
# 📖 CHAPTER
# ─────────────────────────────
class ChapterCreateView(generics.CreateAPIView):
    serializer_class = ChapterSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def perform_create(self, serializer):
        course = serializer.validated_data["course"]

        if course.created_by != self.request.user:
            raise PermissionDenied("Non autorisé")

        obj = serializer.save()
        log_action(self.request.user, "CREATE", obj)


class ChapterDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ChapterSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def get_queryset(self):
        return Chapter.objects.filter(course__created_by=self.request.user)

    def perform_update(self, serializer):
        obj = serializer.save()
        log_action(self.request.user, "UPDATE", obj)

    def perform_destroy(self, instance):
        instance.delete()
        log_action(self.request.user, "DELETE", instance)


# ─────────────────────────────
# 📦 CONTENT
# ─────────────────────────────
class ContentCreateView(generics.CreateAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def perform_create(self, serializer):
        chapter = serializer.validated_data["chapter"]

        if chapter.course.created_by != self.request.user:
            raise PermissionDenied("Non autorisé")

        next_order = (Content.objects.filter(chapter=chapter).aggregate(m=Max("order"))["m"] or 0) + 1
        obj = serializer.save(order=next_order)
        log_action(self.request.user, "CREATE", obj)


class ContentDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ContentSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def get_queryset(self):
        return Content.objects.filter(chapter__course__created_by=self.request.user)

    def perform_update(self, serializer):
        obj = serializer.save()
        log_action(self.request.user, "UPDATE", obj)

    def perform_destroy(self, instance):
        log_action(self.request.user, "DELETE", instance)
        instance.delete()


# ─────────────────────────────
# 🔁 REORDER
# ─────────────────────────────
class ChapterReorderView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, IsTL]

    def post(self, request):
        if not isinstance(request.data, list):
            raise ValidationError("Format invalide: liste attendue")

        for item in request.data:
            chapter_id = item.get("id")
            order = item.get("order")
            if chapter_id is None or order is None:
                raise ValidationError("Chaque item doit contenir id et order")
            try:
                chapter = Chapter.objects.get(id=chapter_id, course__created_by=request.user)
            except ObjectDoesNotExist as exc:
                raise ValidationError(f"Chapitre introuvable: {chapter_id}") from exc

            chapter.order = order
            chapter.save()
            log_action(request.user, "REORDER", chapter)

        return Response({"status": "ok"})


# ─────────────────────────────
# 🏢 GROUPS
# ─────────────────────────────
class CourseGroupListCreateView(generics.ListCreateAPIView):
    serializer_class = CourseGroupSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTL]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return CourseGroup.objects.all()
        return CourseGroup.objects.filter(Q(created_by=self.request.user) | Q(team_leaders=self.request.user)).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CourseGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CourseGroupSerializer
    permission_classes = [IsAuthenticated, IsAdminOrTL]

    def get_queryset(self):
        if self.request.user.role == "admin":
            return CourseGroup.objects.all()
        return CourseGroup.objects.filter(Q(created_by=self.request.user) | Q(team_leaders=self.request.user)).distinct()


class GroupAssignCourseView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTL]

    def post(self, request, pk):
        if request.user.role == "admin":
            group = generics.get_object_or_404(CourseGroup, pk=pk)
        else:
            # Un TL peut assigner s'il a créé le groupe OU s'il y est assigné comme team_leader
            group = generics.get_object_or_404(
                CourseGroup, 
                Q(pk=pk) & (Q(created_by=request.user) | Q(team_leaders=request.user))
            )
            
        course_id = request.data.get("course_id")
        
        if not course_id:
            raise ValidationError("course_id est requis.")
            
        if request.user.role == "admin":
            course = generics.get_object_or_404(Course, pk=course_id)
        else:
            course = generics.get_object_or_404(Course, pk=course_id, created_by=request.user)
        
        course.groups.add(group)
        course.is_public = False # Optionnel : s'il est pour un groupe, on peut le retirer du public
        course.save()
        
        return Response({"detail": f"Le cours a été assigné avec succès au groupe {group.name}."})


class GroupAssignPackageView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTL]

    def post(self, request, pk):
        if request.user.role == "admin":
            group = generics.get_object_or_404(CourseGroup, pk=pk)
        else:
            group = generics.get_object_or_404(
                CourseGroup, 
                Q(pk=pk) & (Q(created_by=request.user) | Q(team_leaders=request.user))
            )
            
        package_id = request.data.get("package_id")
        if not package_id:
            raise ValidationError("package_id est requis.")
            
        if request.user.role == "admin":
            package = generics.get_object_or_404(CoursePackage, pk=package_id)
        else:
            package = generics.get_object_or_404(CoursePackage, pk=package_id, created_by=request.user)
        
        group.packages.add(package)
        return Response({"detail": f"Le package a été assigné avec succès au groupe {group.name}."})


class GroupUnassignPackageView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTL]

    def post(self, request, pk):
        if request.user.role == "admin":
            group = generics.get_object_or_404(CourseGroup, pk=pk)
        else:
            group = generics.get_object_or_404(
                CourseGroup, 
                Q(pk=pk) & (Q(created_by=request.user) | Q(team_leaders=request.user))
            )
            
        package_id = request.data.get("package_id")
        if not package_id:
            raise ValidationError("package_id est requis.")
            
        if request.user.role == "admin":
            package = generics.get_object_or_404(CoursePackage, pk=package_id)
        else:
            package = generics.get_object_or_404(CoursePackage, pk=package_id, created_by=request.user)
        
        group.packages.remove(package)
        return Response({"detail": f"Le package a été retiré avec succès du groupe {group.name}."})



# ─────────────────────────────
# 📈 PROGRESS
# ─────────────────────────────
class MarkChapterProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        action = request.data.get("action")
        print("DEBUG POST PROGRESS: action =", action, "data =", request.data)
        if action not in ["view", "complete", "reset"]:
            print("DEBUG POST PROGRESS: invalid action!")
            raise ValidationError(f"Action must be 'view', 'complete' or 'reset'. Got: {action}")
            
        chapter = generics.get_object_or_404(Chapter, pk=pk)
        progress, _ = ChapterProgress.objects.get_or_create(user=request.user, chapter=chapter)
        
        if action == "view":
            progress.mark_viewed()
        elif action == "complete":
            progress.mark_completed()
        elif action == "reset":
            progress.is_completed = False
            progress.completed_at = None
            progress.save()
            # Reset all contents progress for this chapter
            ContentProgress.objects.filter(user=request.user, content__chapter=chapter).delete()
            
        return Response({
            "status": "ok", 
            "is_viewed": progress.is_viewed, 
            "is_completed": progress.is_completed
        })


class MarkContentProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        content = generics.get_object_or_404(Content, pk=pk)
        progress, _ = ContentProgress.objects.get_or_create(user=request.user, content=content)
        progress.mark_completed()
        
        return Response({
            "status": "ok",
            "is_completed": progress.is_completed
        })



# ─────────────────────────────
# 🗂️ COURSE PACKAGES
# ─────────────────────────────
class CoursePackageListCreateView(generics.ListCreateAPIView):
    serializer_class = CoursePackageSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return CoursePackage.objects.all().order_by("-created_at")
        # TL voit ses propres packages + ceux des autres TL dans ses groupes partagés
        return CoursePackage.objects.filter(created_by=user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CoursePackageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CoursePackageSerializer
    permission_classes = [IsAuthenticated, IsTL]

    def get_queryset(self):
        return CoursePackage.objects.filter(created_by=self.request.user)


# ─────────────────────────────
# 🚫 PACKAGE COURSE EXCLUSION
# ─────────────────────────────
class PackageCourseExclusionView(APIView):
    """
    GET  /courses/packages/<pkg_id>/exclusion/<course_id>/
         Retourne (ou crée) l'objet exclusion pour ce couple package/cours.

    PATCH /courses/packages/<pkg_id>/exclusion/<course_id>/
         Met à jour les listes excluded_chapter_ids / excluded_content_ids.
    """
    permission_classes = [IsAuthenticated, IsTL]

    def _get_or_create(self, pkg_id, course_id, user):
        package = CoursePackage.objects.filter(pk=pkg_id, created_by=user).first()
        if not package:
            return None, None
        course = Course.objects.filter(pk=course_id, is_deleted=False).first()
        if not course:
            return package, None
        excl, _ = PackageCourseExclusion.objects.get_or_create(package=package, course=course)
        return package, excl

    def get(self, request, pkg_id, course_id):
        _, excl = self._get_or_create(pkg_id, course_id, request.user)
        if excl is None:
            return Response({'detail': 'Introuvable.'}, status=404)
        ser = PackageCourseExclusionSerializer(excl, context={'request': request})
        return Response(ser.data)

    def patch(self, request, pkg_id, course_id):
        _, excl = self._get_or_create(pkg_id, course_id, request.user)
        if excl is None:
            return Response({'detail': 'Introuvable.'}, status=404)

        # Mise à jour des chapitres exclus
        chapter_ids = request.data.get('excluded_chapter_ids', None)
        content_ids = request.data.get('excluded_content_ids', None)

        if chapter_ids is not None:
            excl.excluded_chapters.set(Chapter.objects.filter(pk__in=chapter_ids))
        if content_ids is not None:
            excl.excluded_contents.set(Content.objects.filter(pk__in=content_ids))

        excl.save()
        ser = PackageCourseExclusionSerializer(excl, context={'request': request})
        return Response(ser.data)


# ─────────────────────────────
# 📊 STATS (TL)
# ─────────────────────────────
class TLStatsView(APIView):
    permission_classes = [IsAuthenticated, IsTL]

    def get(self, request):
        tab = request.query_params.get("tab", "public")
        
        if tab == "public":
            courses = Course.objects.filter(created_by=request.user, is_public=True, is_deleted=False)
            total_consultants = User.objects.filter(role="consultant").count()
            consultants = User.objects.filter(role="consultant")
        else:
            group_id = request.query_params.get("group_id")
            if not group_id:
                return Response([])
            group = generics.get_object_or_404(CourseGroup, id=group_id, created_by=request.user)
            courses = group.courses.filter(is_deleted=False)
            total_consultants = group.consultants.count()
            consultants = group.consultants.all()
            
        data = []
        for course in courses:
            chapters = course.chapters.all()
            total_chapters = chapters.count()
            
            # Viewers count for this course (at least one chapter viewed)
            viewers = ChapterProgress.objects.filter(
                chapter__course=course, 
                is_viewed=True, 
                user__in=consultants
            ).values('user').distinct().count()
            
            chapters_data = []
            for ch in chapters:
                ch_viewed = ChapterProgress.objects.filter(chapter=ch, is_viewed=True, user__in=consultants).count()
                ch_comp = ChapterProgress.objects.filter(chapter=ch, is_completed=True, user__in=consultants).count()
                chapters_data.append({
                    "id": ch.id,
                    "title": ch.title,
                    "viewed": ch_viewed,
                    "completed": ch_comp
                })
            
            matrix = []
            total_contents = Content.objects.filter(chapter__in=chapters).count()
            for cons in consultants:
                cons_prog = ChapterProgress.objects.filter(user=cons, chapter__in=chapters)
                if total_contents > 0:
                    completed_contents = ContentProgress.objects.filter(user=cons, content__chapter__in=chapters, is_completed=True).count()
                    progress_pct = int((completed_contents / total_contents) * 100)
                else:
                    completed_count = cons_prog.filter(is_completed=True).count()
                    progress_pct = int((completed_count / total_chapters) * 100) if total_chapters > 0 else 0
                
                ch_status = []
                for ch in chapters:
                    p = cons_prog.filter(chapter=ch).first()
                    ch_status.append({
                        "id": ch.id,
                        "title": ch.title,
                        "completed": p.is_completed if p else False
                    })
                    
                matrix.append({
                    "id": cons.id,
                    "name": f"{cons.prenom} {cons.nom}".strip() or cons.email,
                    "progress": progress_pct,
                    "chapters": ch_status
                })
                
            data.append({
                "id": course.id,
                "title": course.title,
                "total_consultants": total_consultants,
                "viewers": viewers,
                "chapters": chapters_data,
                "matrix": matrix
            })
            
        return Response(data)


# ─────────────────────────────
# 📊 STATS (CONSULTANT)
# ─────────────────────────────
class ConsultantStatsView(APIView):
    permission_classes = [IsAuthenticated, IsConsultant]

    def _course_stats(self, course, user, progresses):
        """Helper: compute progress stats for a single course."""
        total_chapters = course.chapters.count()
        total_contents = Content.objects.filter(chapter__course=course).count()
        course_progress = progresses.filter(chapter__course=course)

        if total_contents > 0:
            completed_contents = ContentProgress.objects.filter(
                user=user, content__chapter__course=course, is_completed=True
            ).count()
            prog_pct = int((completed_contents / total_contents) * 100)
        else:
            completed_count = course_progress.filter(is_completed=True).count()
            prog_pct = int((completed_count / total_chapters) * 100) if total_chapters > 0 else 0

        last_p = course_progress.order_by('-viewed_at').first()
        return {
            "id": course.id,
            "title": course.title,
            "progress": prog_pct,
            "chapters_total": total_chapters,
            "chapters_completed": course_progress.filter(is_completed=True).count(),
            "last_activity": last_p.viewed_at if last_p else None,
            "is_complete": prog_pct == 100,
        }

    def get(self, request):
        user = request.user

        progresses = ChapterProgress.objects.filter(user=user).select_related('chapter', 'chapter__course')
        # IDs des cours déjà commencés (pour les KPIs uniquement)
        started_course_ids = set(progresses.values_list('chapter__course_id', flat=True).distinct())

        # ── Groupes + packages ─────────────────────────────────────
        groups = CourseGroup.objects.filter(consultants=user).prefetch_related('courses', 'packages__courses')

        group_course_ids = set()
        groups_data = []

        for g in groups:
            g_courses = g.courses.filter(is_deleted=False)
            g_course_ids = set(g_courses.values_list('id', flat=True))
            group_course_ids.update(g_course_ids)

            # Tous les cours du groupe (même non commencés)
            g_courses_stats = [
                self._course_stats(c, user, progresses)
                for c in g_courses
            ]

            packages_stats = []
            for pkg in g.packages.all():
                p_courses = pkg.courses.filter(is_deleted=False)
                p_course_ids = set(p_courses.values_list('id', flat=True))
                group_course_ids.update(p_course_ids)

                # Tous les cours du package (même non commencés)
                p_courses_stats = [
                    self._course_stats(c, user, progresses)
                    for c in p_courses
                ]
                packages_stats.append({
                    "id": pkg.id,
                    "name": pkg.name,
                    "description": pkg.description,
                    "courses": p_courses_stats,
                })

            groups_data.append({
                "id": g.id,
                "name": g.name,
                "courses": g_courses_stats,
                "packages": packages_stats,
            })

        # ── Cours publics : TOUS les cours publics, sans exclusion ─
        # Un cours peut être à la fois public ET dans un package (avec exclusions).
        # Il doit apparaître dans les deux blocs : ici en version complète,
        # et dans le bloc groupe/package en version personnalisée.
        all_public = Course.objects.filter(
            is_deleted=False, is_public=True, is_mandatory=False
        )

        public_courses = [
            self._course_stats(c, user, progresses)
            for c in all_public
        ]

        # ── Cours obligatoires : TOUS les cours is_mandatory ───────
        all_mandatory = Course.objects.filter(
            is_deleted=False, is_mandatory=True
        )
        mandatory_courses = [
            self._course_stats(c, user, progresses)
            for c in all_mandatory
        ]

        # ── KPIs ───────────────────────────────────────────────────
        all_accessible_ids = (
            set(all_public.values_list('id', flat=True))
            | set(all_mandatory.values_list('id', flat=True))
            | group_course_ids
        )
        total_courses = len(started_course_ids & all_accessible_ids)
        completed_courses_count = sum(
            1 for c in Course.objects.filter(id__in=started_course_ids, is_deleted=False)
            if self._course_stats(c, user, progresses)["is_complete"]
        )
        total_viewed_chapters = progresses.filter(is_viewed=True).count()
        total_completed_chapters = progresses.filter(is_completed=True).count()

        # Timeline
        recent_views = progresses.filter(is_viewed=True, viewed_at__isnull=False).order_by('-viewed_at')[:10]
        recent_completions = progresses.filter(is_completed=True, completed_at__isnull=False).order_by('-completed_at')[:10]

        timeline = []
        for p in recent_views:
            timeline.append({
                "id": f"v_{p.id}",
                "type": "view",
                "course": p.chapter.course.title,
                "chapter": p.chapter.title,
                "date": p.viewed_at
            })
        for p in recent_completions:
            timeline.append({
                "id": f"c_{p.id}",
                "type": "complete",
                "course": p.chapter.course.title,
                "chapter": p.chapter.title,
                "date": p.completed_at
            })
        timeline.sort(key=lambda x: x["date"], reverse=True)
        timeline = timeline[:10]

        return Response({
            "kpis": {
                "total_courses": total_courses,
                "completed_courses": completed_courses_count,
                "total_chapters_viewed": total_viewed_chapters,
                "total_chapters_completed": total_completed_chapters
            },
            "public_courses": public_courses,
            "mandatory_courses": mandatory_courses,
            "groups": groups_data,
            "timeline": timeline
        })


class ConsultantStatsByGGIDView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrTL]

    def get(self, request, ggid):
        user = generics.get_object_or_404(User, ggid=ggid, role="consultant")
        
        progresses = ChapterProgress.objects.filter(user=user).select_related('chapter', 'chapter__course')
        
        course_ids = progresses.values_list('chapter__course_id', flat=True).distinct()
        courses = Course.objects.filter(id__in=course_ids, is_deleted=False)
        
        total_courses = courses.count()
        total_viewed_chapters = progresses.filter(is_viewed=True).count()
        total_completed_chapters = progresses.filter(is_completed=True).count()
        
        courses_data = []
        completed_courses_count = 0
        
        for course in courses:
            total_chapters = course.chapters.count()
            total_contents = Content.objects.filter(chapter__course=course).count()
            course_progress = progresses.filter(chapter__course=course)
            
            if total_contents > 0:
                completed_contents = ContentProgress.objects.filter(user=user, content__chapter__course=course, is_completed=True).count()
                prog_pct = int((completed_contents / total_contents) * 100)
            else:
                completed_count = course_progress.filter(is_completed=True).count()
                prog_pct = int((completed_count / total_chapters) * 100) if total_chapters > 0 else 0
                
            if prog_pct == 100:
                completed_courses_count += 1
                
            last_p = course_progress.order_by('-viewed_at').first()
            
            chapters_data = []
            for ch in course.chapters.all():
                ch_p = course_progress.filter(chapter=ch).first()
                chapters_data.append({
                    "id": ch.id,
                    "title": ch.title,
                    "completed": ch_p.is_completed if ch_p else False
                })
            
            courses_data.append({
                "id": course.id,
                "title": course.title,
                "progress": prog_pct,
                "chapters_total": total_chapters,
                "chapters_completed": course_progress.filter(is_completed=True).count(),
                "last_activity": last_p.viewed_at if last_p else None,
                "chapters_status": chapters_data
            })
            
        return Response({
            "user": {
                "ggid": user.ggid,
                "nom": user.nom,
                "prenom": user.prenom
            },
            "kpis": {
                "total_courses": total_courses,
                "completed_courses": completed_courses_count,
                "total_chapters_viewed": total_viewed_chapters,
                "total_chapters_completed": total_completed_chapters
            },
            "courses": courses_data
        })



# ─────────────────────────────
# 🏢 MES GROUPES (CONSULTANT)
# ─────────────────────────────
class ConsultantMyGroupsView(APIView):
    permission_classes = [IsAuthenticated, IsConsultant]

    def get(self, request):
        user = request.user
        groups = CourseGroup.objects.filter(consultants=user).prefetch_related('courses', 'packages', 'created_by')
        
        data = []
        for g in groups:
            courses = g.courses.filter(is_deleted=False)
            course_data = []
            for c in courses:
                course_data.append({
                    "id": c.id,
                    "title": c.title,
                    "description": getattr(c, 'description', ''),
                    "duration": getattr(c, 'duration', ''),
                    "chapters_count": c.chapters.count()
                })
            
            packages_data = []
            for p in g.packages.all():
                p_courses = []
                for c in p.courses.filter(is_deleted=False):
                    # Récupérer les exclusions pour ce couple (package, course)
                    exclusion = PackageCourseExclusion.objects.filter(
                        package=p, course=c
                    ).first()
                    excluded_chapter_ids = (
                        list(exclusion.excluded_chapters.values_list('id', flat=True))
                        if exclusion else []
                    )
                    # Nombre de chapitres visibles après exclusions
                    visible_chapters = c.chapters.exclude(id__in=excluded_chapter_ids).count()

                    p_courses.append({
                        "id": c.id,
                        "title": c.title,
                        "description": getattr(c, 'description', ''),
                        "duration": getattr(c, 'duration', ''),
                        "chapters_count": visible_chapters,           # ✅ Filtré
                        "chapters_total_original": c.chapters.count() # Info bonus
                    })
                packages_data.append({
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "courses": p_courses
                })
            
            data.append({
                "id": g.id,
                "name": g.name,
                "created_by": f"{g.created_by.prenom} {g.created_by.nom}".strip(),
                "courses": course_data,
                "packages": packages_data
            })
            
        return Response(data)



# ─────────────────────────────
# 📊 STATS (ADMIN)
# ─────────────────────────────
class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        tls = User.objects.filter(role="tl", is_active=True)
        
        tls_data = []
        all_cons_ids = []
        for tl in tls:
            groups = CourseGroup.objects.filter(Q(created_by=tl) | Q(team_leaders=tl)).distinct()
            group_ids = groups.values_list('id', flat=True)
            consultants = User.objects.filter(course_groups__id__in=group_ids).distinct()
            all_cons_ids.extend(list(consultants.values_list('id', flat=True)))
            
            total_prog_sum = 0
            cons_count = 0
            for cons in consultants:
                cons_courses = Course.objects.filter(groups__consultants=cons, is_deleted=False).distinct()
                cons_contents_count = Content.objects.filter(chapter__course__in=cons_courses).count()
                
                if cons_contents_count > 0:
                    cons_completed = ContentProgress.objects.filter(user=cons, content__chapter__course__in=cons_courses, is_completed=True).count()
                    total_prog_sum += (cons_completed / cons_contents_count) * 100
                    cons_count += 1
                else:
                    cons_chapters_count = Chapter.objects.filter(course__in=cons_courses).count()
                    if cons_chapters_count > 0:
                        cons_completed = ChapterProgress.objects.filter(user=cons, chapter__course__in=cons_courses, is_completed=True).count()
                        total_prog_sum += (cons_completed / cons_chapters_count) * 100
                        cons_count += 1
            
            avg_progress = int(total_prog_sum / cons_count) if cons_count > 0 else 0

            active_members = []
            active_cons = consultants.annotate(
                comp_count=Count('progress', filter=Q(progress__is_completed=True))
            ).order_by('-comp_count')[:5]
            
            for cons in active_cons:
                active_members.append({
                    "id": cons.id,
                    "name": f"{cons.prenom} {cons.nom}".strip() or cons.email,
                    "completed": cons.comp_count,
                    "avatar": cons.profile_photo.url if cons.profile_photo else None
                })

            tls_data.append({
                "id": tl.id,
                "name": f"{tl.prenom} {tl.nom}".strip() or tl.email,
                "groups_count": groups.count(),
                "consultants_count": consultants.count(),
                "avg_progress": avg_progress,
                "status": "Excellence" if avg_progress >= 80 else "Stable" if avg_progress >= 50 else "Attention",
                "active_members": active_members,
                "last_activity": ChapterProgress.objects.filter(user__in=consultants).aggregate(Max('completed_at'))['completed_at__max'],
                "groups": [
                    {
                        "id": g.id, 
                        "name": g.name, 
                        "cons_count": g.consultants.count(),
                        "progress": int(sum([
                            (ContentProgress.objects.filter(user=c, content__chapter__course__in=g.courses.all(), is_completed=True).count() / 
                             max(Content.objects.filter(chapter__course__in=g.courses.all()).count(), 1)) * 100 
                            if Content.objects.filter(chapter__course__in=g.courses.all()).count() > 0 else
                            (ChapterProgress.objects.filter(user=c, chapter__course__in=g.courses.all(), is_completed=True).count() / 
                             max(Chapter.objects.filter(course__in=g.courses.all()).count(), 1)) * 100 
                            for c in g.consultants.all()
                        ]) / max(g.consultants.count(), 1))
                    } for g in groups
                ]
            })

        # Global Platform Stats
        total_consultants = User.objects.filter(role="consultant").count()
        total_courses = Course.objects.filter(is_deleted=False).count()
        total_groups = CourseGroup.objects.count()

        # Recent Activity (Timeline)
        recent_activity = []
        progresses_all = ChapterProgress.objects.filter(is_completed=True).select_related('user', 'chapter', 'chapter__course').order_by('-completed_at')[:10]
        for p in progresses_all:
            recent_activity.append({
                "id": p.id,
                "user": f"{p.user.prenom} {p.user.nom}".strip(),
                "course": p.chapter.course.title,
                "chapter": p.chapter.title,
                "date": p.completed_at
            })

        # Course Distribution (Top Courses)
        top_courses = []
        courses = Course.objects.filter(is_deleted=False).annotate(enrollments=Count('groups__consultants', distinct=True)).order_by('-enrollments')[:5]
        for c in courses:
            top_courses.append({
                "title": c.title,
                "enrollments": c.enrollments
            })

        return Response({
            "tls": tls_data,
            "global": {
                "total_consultants": total_consultants,
                "total_courses": total_courses,
                "total_groups": total_groups,
                "trends": {
                    "consultants": "+12%",
                    "courses": "+5%",
                    "engagement": "+18%"
                }
            },
            "recent_activity": recent_activity,
            "top_courses": top_courses
        })
