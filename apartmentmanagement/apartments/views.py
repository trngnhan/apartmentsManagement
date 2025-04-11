from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash, authenticate, login
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse


@login_required
def change_password(request):
    if request.method == 'POST':
        current = request.POST['current_password']
        new = request.POST['new_password']
        confirm = request.POST['confirm_password']

        if len(new) < 8:
            messages.error(request, 'Mật khẩu mới phải có ít nhất 8 ký tự.')
            return render(request, 'change_password.html')

        if not request.user.check_password(current):
            messages.error(request, 'Mật khẩu hiện tại không đúng.')
            return render(request, 'change_password.html')

        if new != confirm:
            messages.error(request, 'Mật khẩu xác nhận không trùng khớp.')
            return render(request, 'change_password.html')

        request.user.set_password(new)
        request.user.must_change_password = False
        request.user.save()
        update_session_auth_hash(request, request.user)  # tránh logout sau khi đổi mật khẩu
        messages.success(request, 'Đổi mật khẩu thành công.')
        return redirect('resident_home')

    return render(request, 'change_password.html')


@login_required
def upload_avatar(request):
    if request.method == 'POST':
        avatar = request.FILES.get('avatar')
        if avatar.content_type not in ['image/jpeg', 'image/png']:
            messages.error(request, 'Ảnh không hợp lệ. Chỉ chấp nhận JPEG hoặc PNG.')
        if avatar:
            request.user.profile_picture = avatar
            request.user.save()
            return redirect('home')  # hoặc chuyển đến trang chính

    return render(request, 'upload_avatar.html')


def resident_login_view(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, username=email, password=password)

        if user is not None and user.role == 'RESIDENT':
            login(request, user)
            if user.must_change_password:
                return redirect(reverse('change_password'))
            return redirect('resident_home')
        else:
            messages.error(request, "Email hoặc mật khẩu không đúng hoặc bạn không phải cư dân.")

    return render(request, 'resident_login.html')

@login_required
def resident_home_view(request):
    return render(request, 'resident_home.html')