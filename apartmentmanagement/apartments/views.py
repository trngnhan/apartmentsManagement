from cloudinary.utils import now
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash, authenticate, login, get_user_model
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.views.generic import detail
from rest_framework import viewsets, generics, permissions, status, parsers, renderers
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser
from .permissions import IsAdminRole, IsAdminOrSelf, IsAdminOrManagement
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .pagination import Pagination
from apartments import serializers

from apartments.serializers import UserSerializer, ResidentSerializer, ApartmentSerializer, \
    ApartmentTransferHistorySerializer, FirebaseTokenSerializer, ParcelItemSerializer, ParcelLockerSerializer, \
    FeedbackSerializer, SurveySerializer, SurveyOptionSerializer, SurveyResponseSerializer, \
    VisitorVehicleRegistrationSerializer
from .models import (
    Resident, Apartment, ApartmentTransferHistory, PaymentCategory,
    PaymentTransaction, FirebaseToken, ParcelLocker, ParcelItem,
    Feedback, Survey, SurveyOption, SurveyResponse, VisitorVehicleRegistration
)

User = get_user_model()

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

#ViewSet: Cho phép định nghĩa các hành động như list, retrieve, create, update...
#ListAPIView: Trả về danh sách người dùng.
#RetrieveAPIView: Trả về thông tin chi tiết của 1 người dùng (/users/1/)
#CreateAPIView, UpdateAPIView: Cho phép tạo và cập nhật người dùng.

class UserViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['email', 'date_joined']
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])

    def get_current_user(self, request):
        u = request.user
        if request.method == 'PATCH':
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(u, k, v)
                elif k == 'password':
                    u.set_password(v)
                elif k == 'must_change_password':  # Xử lý must_change_password
                    u.must_change_password = v.lower() == 'true' if isinstance(v, str) else bool(v)

            # Xử lý file ảnh
            if 'profile_picture' in request.FILES:
                u.profile_picture = request.FILES['profile_picture']

            u.save()

        return Response(serializers.UserSerializer(u).data)

class ResidentViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Resident.objects.filter(active=True)
    serializer_class = ResidentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'id_number']

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    @action(methods=['get', 'patch'], url_path='current-resident', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_resident(self, request):
        resident = Resident.objects.filter(user=request.user).first()
        if not resident:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        if request.method.__eq__('PATCH'):
            serializer = self.get_serializer(resident, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        serializer = self.get_serializer(resident)
        return Response(serializer.data)

# Apartment ViewSet
class ApartmentViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Apartment.objects.filter(active=True)
    serializer_class = ApartmentSerializer
    pagination_class = Pagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['building', 'floor', 'active']
    search_fields = ['code', 'building', 'number', 'owner__email']
    ordering_fields = ['building', 'floor', 'number']

    def get_permissions(self):
        # Cấp quyền cho admin với quyền xem, tạo, cập nhật và chuyển nhượng căn hộ
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'transfer_apartment']:
            return [IsAdminUser()]  # Admin chỉ có quyền này
        elif self.action in ['list', 'retrieve']: #Management có quyền xem căn hộ
            return [IsAdminOrManagement()]  # Admin và Management có quyền
        return [permissions.IsAuthenticated()]  # Mọi người đều có quyền xem căn hộ

    def get_queryset(self):
        query = self.queryset.filter(active=True)

        building = self.request.query_params.get('building')
        if building:
            query = query.filter(building__icontains=building)

        floor = self.request.query_params.get('floor')
        if floor:
            query = query.filter(floor=floor)

        return query

    @action(methods=['get'], detail=False, url_path='get-apartment')
    def get_apartments(self, request):
        apartments = Apartment.objects.filter(owner=request.user, active=True)
        page = self.paginate_queryset(apartments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(apartments, many=True)
        return Response(serializer.data)

    @action(methods=['post'], detail=True, url_path='transfer')
    def transfer_apartment(self, request, pk=None):
        apartment = self.get_object()

        # Lấy ID người nhận căn hộ mới và ghi chú chuyển nhượng từ request
        new_owner_id = request.data.get("new_owner_id")
        note = request.data.get("note", "")

        if not new_owner_id:
            return Response(
                {"detail": "Vui lòng cung cấp ID người nhận (new_owner_id)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kiểm tra xem người nhận có tồn tại trong hệ thống không
        try:
            new_owner = User.objects.get(id=new_owner_id)
        except User.DoesNotExist:
            return Response({"detail": "Người nhận không tồn tại."},
                            status=status.HTTP_404_NOT_FOUND)

        # Kiểm tra xem người nhận có phải là chủ sở hữu hiện tại căn hộ khác không
        if new_owner == apartment.owner:
            return Response({"detail": "Người nhận đã là chủ sở hữu căn hộ này."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Tạo lịch sử chuyển nhượng căn hộ
        ApartmentTransferHistory.objects.create(
            apartment=apartment,
            previous_owner=apartment.owner,
            new_owner=new_owner,
            transfer_date=now().date(),
            note=note
        )

        # Cập nhật chủ sở hữu mới cho căn hộ
        apartment.owner = new_owner
        apartment.save()

        # Trả về thông tin căn hộ sau khi chuyển nhượng
        return Response({
            "detail": "Chuyển nhượng căn hộ thành công.",
            "new_owner": UserSerializer(new_owner).data
        }, status=status.HTTP_200_OK)


# Apartment Transfer History ViewSet
class ApartmentTransferHistoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = ApartmentTransferHistory.objects.filter(active=True)
    serializer_class = ApartmentTransferHistorySerializer
    pagination_class = Pagination  # Phân trang
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['apartment', 'previous_owner', 'new_owner', 'active']
    ordering_fields = ['transfer_date', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        apartment = self.request.query_params.get('apartment')
        if apartment:
            queryset = queryset.filter(apartment=apartment)
        return queryset

    @action(methods=['post'], detail=True, url_path='add-transfer-history')
    def add_transfer_history(self, request, pk=None):
        # Tạo lịch sử chuyển nhượng cho một căn hộ. Chỉ quản trị viên mới có thể thực hiện.

        apartment = Apartment.objects.get(id=pk)
        new_owner_id = request.data.get('new_owner_id')
        previous_owner_id = apartment.owner.id

        if not new_owner_id:
            return Response({"detail": "Vui lòng cung cấp ID người nhận."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra người nhận có tồn tại
        try:
            new_owner = User.objects.get(id=new_owner_id)
        except User.DoesNotExist:
            return Response({"detail": "Người nhận không tồn tại."},
                            status=status.HTTP_404_NOT_FOUND)

        # Tạo lịch sử chuyển nhượng
        transfer_history = ApartmentTransferHistory.objects.create(
            apartment=apartment,
            previous_owner=apartment.owner,
            new_owner=new_owner,
            transfer_date=now().date(),
            note=request.data.get('note', '')
        )

        # Cập nhật chủ sở hữu mới cho căn hộ
        apartment.owner = new_owner
        apartment.save()

        return Response(ApartmentTransferHistorySerializer(transfer_history).data, status=status.HTTP_201_CREATED)


# Payment Category ViewSet
class PaymentCategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = PaymentCategory.objects.filter(active=True)
    serializer_class = serializers.PaymentCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_recurring', 'active']
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'list']:
            return [IsAdminUser()]
        return [IsAdminOrManagement]


# Payment Transaction ViewSet
class PaymentTransactionViewSet(viewsets.ViewSet):
    queryset = PaymentTransaction.objects.filter(active=True)
    serializer_class = serializers.PaymentTransactionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['apartment', 'category', 'method', 'status', 'active']
    ordering_fields = ['paid_date', 'created_date', 'amount']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminUser()]
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các giao dịch của căn hộ mà họ sở hữu
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(apartment__owner=self.request.user)

        status_param = self.request.query_params.get('status')
        if status_param:
            query = query.filter(status=status_param)

        return query

    @action(methods=['get'], detail=False, url_path='my-payments')
    def my_payments(self, request):
       #Trả về danh sách giao dịch thanh toán của người dùng hiện tại
        payments = PaymentTransaction.objects.filter(apartment__owner=request.user)
        serializer = self.get_serializer(payments, many=True)
        return Response(serializer.data)

    @action(methods=['post'], detail=True, url_path='upload-proof', parser_classes=[parsers.MultiPartParser])
    def upload_proof(self, request, pk):
        #Tải lên bằng chứng thanh toán
        transaction = self.get_object()
        if transaction.apartment.owner != request.user and not request.user.is_staff:
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        if 'payment_proof' not in request.data:
            return Response(
                {"detail": "Không tìm thấy file bằng chứng thanh toán."},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.payment_proof = request.data['payment_proof']
        transaction.status = 'PENDING'
        transaction.save()

        return Response(self.get_serializer(transaction).data)

    @action(methods=['patch'], detail=True, url_path='update-payment', permission_classes=[IsAdminUser])
    def mark_completed(self, request, pk=None):
        transaction = self.get_object()

        if transaction.status == 'COMPLETED':
            return Response(
                {"detail": "Giao dịch này đã hoàn tất."},
                status=status.HTTP_400_BAD_REQUEST
            )

        transaction.status = 'COMPLETED'
        transaction.save()

        return Response(
            {"detail": "Giao dịch đã được đánh dấu là hoàn tất."},
            status=status.HTTP_200_OK
        )

# Firebase Token ViewSet
class FirebaseTokenViewSet(viewsets.ViewSet):
    queryset = FirebaseToken.objects.filter(active=True)
    serializer_class = FirebaseTokenSerializer

    def get_permissions(self):
        #Xác định quyền truy cập cho các action.
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAdminUser()]  # Chỉ cho phép Admin xem danh sách hoặc chi tiết
        return [permissions.IsAuthenticated()]  # Các hành động khác yêu cầu người dùng đã xác thực

    @action(methods=['post'], detail=False, url_path='update-token')
    def update_token(self, request):
        #Cập nhật token Firebase cho người dùng hiện tại
        token = request.data.get('token')
        if not token:
            return Response(
                {"detail": "Token không được cung cấp."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cập nhật hoặc tạo mới token Firebase cho người dùng hiện tại
        token_obj, created = FirebaseToken.objects.update_or_create(
            user=request.user,
            defaults={'token': token}
        )

        # Trả về dữ liệu token đã được cập nhật hoặc tạo mới
        serializer = self.get_serializer(token_obj)
        return Response({
            'created': created,
            'data': serializer.data
        }, status=status.HTTP_200_OK)

# Parcel Locker ViewSet
class ParcelLockerViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = ParcelLocker.objects.filter(active=True)
    serializer_class = ParcelLockerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resident', 'active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminRole]
        if self.action in ['add-item', 'update-item-status']:  # Management và Admin có thể đánh dấu đã nhận
            return [IsAdminOrManagement()]  # Quyền cho cả Admin và Management
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = ParcelLocker.objects.all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(resident__user=self.request.user)
        return queryset

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

    def get_object(self):
        try:
            # Lấy đối tượng từ queryset bằng cách sử dụng pk từ URL
            return self.queryset.get(pk=self.kwargs["pk"])
        except ParcelLocker.DoesNotExist:
            raise NotFound("Không tìm thấy tủ đồ với ID này.")

    @action(methods=['get'], detail=False, url_path='my-locker')
    def my_locker(self, request):
        # Trả về tủ đồ của người dùng hiện tại
        try:
            # Tìm cư dân của người dùng hiện tại
            resident = Resident.objects.get(user=request.user)
            locker = ParcelLocker.objects.get(resident=resident)
            serializer = self.get_serializer(locker)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Cư dân không tồn tại."},
                status=status.HTTP_404_NOT_FOUND
            )
        except ParcelLocker.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy tủ đồ cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(methods=['get'], detail=True, url_path='items')
    def get_items(self, request, pk=None):
        # Trả về danh sách đồ trong tủ
        locker = self.get_object()
        items = locker.items.all()  # Quan hệ related_name='items' từ model
        serializer = ParcelItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # Thêm món đồ vào tủ đồ của cư dân
    @action(methods=['post'], detail=True, url_path='add-item')
    def add_item(self, request, pk=None):
        locker = self.get_object()
        item_name = request.data.get('item_name')
        if not item_name:
            return Response({"detail": "Tên món đồ là bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        item = locker.items.create(name=item_name)
        serializer = ParcelItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['patch'], detail=True, url_path='update-item-status')
    def update_item_status(self, request, pk=None):
        #Cập nhật trạng thái của món đồ trong tủ đồ.
        #Chỉ cho phép admin cập nhật trạng thái từ PENDING sang trạng thái khác.
        if not request.user.is_staff:
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        item_id = request.data.get('item_id')
        new_status = request.data.get('status')

        print("Request method:", request.method)
        print("Request content-type:", request.content_type)
        print("Request body:", request.body)
        print("Parsed data:", request.data)

        if new_status not in ['PENDING', 'RECEIVED']:
            return Response(
                {"detail": "Trạng thái không hợp lệ."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            locker = self.get_object()  # Lấy tủ đồ hiện tại
            item = locker.items.get(id=item_id)  # Tìm món đồ trong tủ đồ

            if item.status != 'PENDING':
                return Response(
                    {"detail": "Chỉ có thể chuyển trạng thái từ PENDING sang trạng thái khác."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Cập nhật trạng thái món đồ
            item.status = new_status
            item.save()

            # Trả về dữ liệu đã cập nhật
            serializer = ParcelItemSerializer(item)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ParcelItem.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy món đồ này."},
                status=status.HTTP_404_NOT_FOUND
            )
        except ParcelLocker.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy tủ đồ này."},
                status=status.HTTP_404_NOT_FOUND
            )


# Feedback ViewSet
class FeedbackViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Feedback.objects.filter(active=True)
    serializer_class = FeedbackSerializer
    pagination_class = Pagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resident', 'status', 'active']
    search_fields = ['title', 'content']
    ordering_fields = ['created_date', 'updated_date']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]  # Cư dân gửi phản ánh
        elif self.action in ['destroy']:
            return [IsAdminRole]  # Chỉ admin mới được xóa
        elif self.action in ['update', 'partial_update', 'list']:
            return [IsAdminOrManagement()]  # Admin + Management được sửa, xem tất cả
        return [permissions.IsAuthenticated()]  # Mặc định các quyền khác

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các phản hồi của họ
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    def create(self, request, *args, **kwargs):
        #Tạo phản hồi mới
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(resident=resident)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], detail=False, url_path='my-feedbacks')
    def my_feedbacks(self, request):
        #Trả về danh sách phản hồi của người dùng hiện tại
        feedbacks = Feedback.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(feedbacks, many=True)
        return Response(serializer.data)

    @action(methods=['patch'], detail=True, url_path='update-my-feedback')
    def update_my_feedback(self, request, pk=None):
        #Cho phép cư dân cập nhật nội dung phản hồi của chính họ.
        try:
            feedback = self.get_queryset().get(pk=pk)
        except Feedback.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy phản hồi."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra quyền: phải là cư dân sở hữu phản hồi
        if not request.user.is_staff and feedback.resident.user != request.user:
            return Response(
                {"detail": "Bạn không có quyền chỉnh sửa phản hồi này."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(feedback, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(methods=['delete'], detail=True, url_path='delete-my-feedback')
    def soft_delete(self, request, pk=None):
        """
        Xoá mềm phản hồi (đặt active=False).
        - Cư dân chỉ được xoá phản hồi của chính họ.
        - Admin được xoá tất cả phản hồi.
        """
        try:
            feedback = self.get_queryset().get(pk=pk)
        except Feedback.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy phản hồi."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra quyền sở hữu nếu không phải admin
        if not request.user.is_staff:
            if feedback.resident.user != request.user:
                return Response(
                    {"detail": "Bạn không có quyền xoá phản hồi này."},
                    status=status.HTTP_403_FORBIDDEN
                )

        # Xoá mềm: thay vì xoá ra khỏi database ta sử dụng ẩn các feedback khỏi giao diện
        feedback.active = False
        feedback.save()

        return Response(
            {"detail": "Phản hồi đã được xoá."},
            status=status.HTTP_204_NO_CONTENT
        )


# Survey ViewSet: Phiếu khảo sát: hiển thị phiếu khảo sát và tạo khảo sát
class SurveyViewSet(viewsets.ViewSet):
    queryset = Survey.objects.filter(active=True)
    serializer_class = SurveySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['active']
    search_fields = ['title', 'description']
    ordering_fields = ['deadline', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'list', 'retrieve', 'post']:
            return [IsAdminOrManagement()]  # Cho cả Admin và Management
        elif self.action in ['get-responses']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]  # Cư dân có thể tham gia khảo sát

    def get_object(self):
        try:
            return Survey.objects.get(pk=self.kwargs["pk"])
        except Survey.DoesNotExist:
            raise NotFound("Không tìm thấy phiếu khảo sát.")

    def create(self, request, *args, **kwargs):
        #Tạo khảo sát với các tùy chọn
        options_data = request.data.pop('options', [])
        serializer = self.get_serializer(data=request.data, context={'options': options_data})
        serializer.is_valid(raise_exception=True)
        survey = serializer.save()

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # Trả về danh sách tùy chọn (VD: Hai long or Khong hai long) của khảo sát
    @action(methods=['get'], detail=True, url_path='get-options')
    def get_options(self, request, pk):
        survey = self.get_object()
        options = survey.options.filter(active=True)
        return Response(SurveyOptionSerializer(options, many=True).data)

    # Trả về danh sách phản hồi của khảo sát (chỉ dành cho admin)
    @action(methods=['get'], detail=True, url_path='get-responses')
    def get_responses(self, request, pk):
        if not request.user.is_staff:
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        survey = self.get_object()
        responses = SurveyResponse.objects.filter(survey=survey)
        return Response(SurveyResponseSerializer(responses, many=True).data)


# Survey Option ViewSet: Hiển thị các lựa chọn và tạo các lựa chọn trong khảo sát
class SurveyOptionViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView, generics.CreateAPIView):
    queryset = SurveyOption.objects.filter(active=True)
    serializer_class = SurveyOptionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminOrManagement]
        if self.action in ['destroy']:
            return [IsAdminRole]
        return [permissions.IsAuthenticated()]


# Survey Response ViewSet: Phản hồi của cư dân khi tham gia khảo sát
class SurveyResponseViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = SurveyResponse.objects.filter(active=True)
    serializer_class = SurveyResponseSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'option', 'resident', 'active']

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        elif self.action in ['destroy']:
            return [IsAdminRole]
        elif self.action in ['update', 'partial_update', 'list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các phản hồi khảo sát của họ
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    def create(self, request, *args, **kwargs):
        #Tạo phản hồi khảo sát mới
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Kiểm tra xem người dùng đã phản hồi khảo sát này chưa
        survey_id = request.data.get('survey')
        existing_response = SurveyResponse.objects.filter(survey_id=survey_id, resident=resident).first()
        if existing_response:
            return Response(
                {"detail": "Bạn đã phản hồi khảo sát này rồi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(resident=resident)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['get'], detail=False, url_path='my-responses')
    def my_responses(self, request):
        #Trả về danh sách phản hồi khảo sát của người dùng hiện tại
        responses = SurveyResponse.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(responses, many=True)
        return Response(serializer.data)


# Visitor Vehicle Registration ViewSet
class VisitorVehicleRegistrationViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = VisitorVehicleRegistration.objects.filter(active=True)
    serializer_class = VisitorVehicleRegistrationSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['resident', 'approved', 'active']
    search_fields = ['visitor_name', 'vehicle_number']
    ordering_fields = ['registration_date', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve', 'my_registrations']:
            # Cư dân và quản lý đều có quyền tạo và xem
            return [permissions.IsAuthenticated()]
        elif self.action in ['approve', 'reject', 'update', 'partial_update', 'destroy']:
            # Chỉ admin hoặc management mới có quyền duyệt, từ chối hoặc chỉnh sửa
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các đăng ký xe của họ
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    def create(self, request, *args, **kwargs):
        #Tạo đăng ký xe mới
        try:
            resident = Resident.objects.get(user=request.user)
        except Resident.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(resident=resident)

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['post'], detail=True, url_path='approve')
    def approve(self, request, pk):
        try:
            registration = self.get_object()
        except VisitorVehicleRegistration.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy đăng ký xe."},
                status=status.HTTP_404_NOT_FOUND
            )
        if not request.user.is_staff:
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )
        registration.approved = True
        registration.save()
        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(methods=['post'], detail=True, url_path='reject')
    def reject(self, request, pk):
        #Từ chối đăng ký giữ xe (chỉ dành cho admin hoặc management)
        registration = self.get_object()

        # Kiểm tra quyền
        if not request.user.is_staff and getattr(request.user, 'role', '') != 'MANAGEMENT':
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        registration.approved = False
        registration.save()

        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='my-registrations')
    def my_registrations(self, request):
        #Trả về danh sách đăng ký xe của người dùng hiện tại
        registrations = VisitorVehicleRegistration.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(registrations, many=True)
        return Response(serializer.data)