from django.urls import path
from .views import *

urlpatterns = [
    # COURSES
    path("", CourseListCreateView.as_view()),
    path("browse/", ConsultantCourseBrowseView.as_view()),
    path("browse/<int:pk>/", ConsultantCourseRetrieveView.as_view()),
    path("<int:pk>/", CourseDetailView.as_view()),

    # CHAPTERS
    path("chapters/", ChapterCreateView.as_view()),
    path("chapters/<int:pk>/", ChapterDetailView.as_view()),
    path("chapters/reorder/", ChapterReorderView.as_view()),

    # CONTENT
    # CONTENT
    path("contents/", ContentCreateView.as_view()),
    path("contents/<int:pk>/", ContentDetailView.as_view()),

    # PROGRESS
    path("chapters/<int:pk>/progress/", MarkChapterProgressView.as_view()),
    path("contents/<int:pk>/progress/", MarkContentProgressView.as_view()),

    # GROUPS
    path("groups/", CourseGroupListCreateView.as_view()),
    path("groups/<int:pk>/", CourseGroupDetailView.as_view()),
    path("groups/<int:pk>/assign-course/", GroupAssignCourseView.as_view()),
    path("groups/<int:pk>/assign-package/", GroupAssignPackageView.as_view()),
    path("groups/<int:pk>/unassign-package/", GroupUnassignPackageView.as_view()),

    # PACKAGES
    path("packages/", CoursePackageListCreateView.as_view()),
    path("packages/<int:pk>/", CoursePackageDetailView.as_view()),
    path("packages/<int:pkg_id>/exclusion/<int:course_id>/", PackageCourseExclusionView.as_view()),


    # STATS
    path("stats/", TLStatsView.as_view()),
    path("consultant-stats/", ConsultantStatsView.as_view()),
    path("stats/<str:ggid>/", ConsultantStatsByGGIDView.as_view()),
    path("admin-stats/", AdminStatsView.as_view()),
    
    # CONSULTANT GROUPS
    path("my-groups/", ConsultantMyGroupsView.as_view()),
]
