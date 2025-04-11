from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

from .views import resident_login_view, resident_home_view

router = DefaultRouter()
urlpatterns = [
    path('', include(router.urls)),
    path('login/', resident_login_view, name='resident_login'),
    path('change-password/', views.change_password, name='change_password'),
    path('upload-avatar/', views.upload_avatar, name='upload_avatar'),
    path('home/', resident_home_view, name='resident_home'),
]