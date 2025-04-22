from rest_framework.permissions import BasePermission, IsAuthenticated
from apartments.models import User


class IsAdminRole(BasePermission):
    #Chỉ cho phép người dùng có role ADMIN.

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == User.Role.ADMIN
        )

class IsAdminOrSelf(BasePermission):
    def has_permission(self, request, view, obj):
        if request.user.is_staff:
            return True

        return obj == request.user

class IsAdminOrOwner(IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.owner == request.user

class IsAdminOrManagement(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.is_staff or getattr(request.user, 'role', '') == 'MANAGEMENT')

    def has_object_permission(self, request, view, obj):
        # Nếu là quản lý hoặc admin, cho phép quyền truy cập
        return request.user.is_staff or request.user.role == 'MANAGEMENT'