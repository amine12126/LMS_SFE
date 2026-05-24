"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="LMS SFE API Document",
      default_version='v1',
      description="Documentation interactive et complète de l'API RESTful de la plateforme LMS SFE",
      contact=openapi.Contact(email="amine12126@gmail.com"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # 📝 SWAGGER & API DOCUMENTATION
    path('swagger<format>/', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    # Compat frontend: baseURL http://localhost:3002 + "auth/..."
    path('auth/', include('apps.authentication.urls')),
   path('api/users/', include('apps.users.urls')),
   path('users/', include('apps.users.urls')),
   path('api/courses/', include('apps.courses.urls')),
   path('courses/', include('apps.courses.urls')),
]

from django.urls import re_path
from django.views.static import serve

# Serve media files (PDFs, images, etc.) in both development and production
urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]