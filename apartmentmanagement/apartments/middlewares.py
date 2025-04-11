from django.shortcuts import redirect
from django.urls import reverse

class MustChangePasswordMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Bỏ qua nếu là admin hoặc staff
            if request.user.is_superuser or request.user.is_staff:
                return self.get_response(request)

            if request.user.must_change_password:
                current_path = request.path
                change_password_url = reverse('change_password')
                if current_path != change_password_url:
                    return redirect('change_password')
        return self.get_response(request)
