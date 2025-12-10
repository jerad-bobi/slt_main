"""
URL configuration for slt_main project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
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
from django.urls import path

from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('level/', views.level, name='level'),
    path('practice/', views.practice, name='practice'),
    path('dictionary/', views.dictionary, name='dictionary'),
    path('profile/', views.profile, name='profile'),
    path('chapter/<int:chapter_num>/', views.chapter, name='chapter'),
    path('api/asl-video/', views.asl_video_api, name='asl_video_api'),
    path('admin/', admin.site.urls),
]
