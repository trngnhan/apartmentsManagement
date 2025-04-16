from cloudinary.utils import now
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash, authenticate, login, get_user_model
from django.shortcuts import render, redirect
from django.contrib import messages
from django.urls import reverse
from django.views.generic import detail
from rest_framework import viewsets, generics, permissions, status, parsers, renderers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .pagination import ApartmentPagination
from apartments import serializers

from apartments.serializers import UserSerializer, ResidentSerializer, ApartmentSerializer, \
    ApartmentTransferHistorySerializer, FirebaseTokenSerializer, ParcelItemSerializer, ParcelLockerSerializer
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

# Custom Permissions
#Cho phép truy cập neu đó là Admin hoặc Staff hoặc chính người dùng đó đã đăng nhập
# Khi dùng để kiểm soát update, retrieve của user hoặc resident profile.
class IsAdminOrSelf(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj == request.user or getattr(obj, 'user', None) == request.user
#Cho phép truy cập neu đó là Admin hoặc chính người dùng đó đã đăng nhập
class IsAdminOrOwner(permissions.IsAuthenticated):
    def has_object_permission(self, request, view, obj):
        return request.user.is_staff or obj.owner == request.user

#ViewSet: Cho phép định nghĩa các hành động như list, retrieve, create, update...
#ListAPIView: Trả về danh sách người dùng.
#RetrieveAPIView: Trả về thông tin chi tiết của 1 người dùng (/users/1/)
#CreateAPIView, UpdateAPIView: Cho phép tạo và cập nhật người dùng.

class UserViewSet(viewsets.GenericViewSet,
                  generics.RetrieveAPIView,
                  generics.ListAPIView,
                  generics.CreateAPIView,
                  generics.UpdateAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['email', 'date_joined']
    parser_classes = [parsers.MultiPartParser]

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAdminUser()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated])

    def get_current_user(self, request):
        u = request.user
        if request.method.__eq__('PATCH'):
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(u, k, v)
                elif k.__eq__('password'):
                    u.set_password(v)

            u.save()

        return Response(serializers.UserSerializer(u).data)

class ResidentViewSet(viewsets.GenericViewSet,
                      generics.ListAPIView,
                      generics.RetrieveAPIView,
                      generics.CreateAPIView,
                      generics.UpdateAPIView):
    queryset = Resident.objects.filter(active=True)
    serializer_class = ResidentSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'id_number']

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [permissions.IsAdminUser()]
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
class ApartmentViewSet(viewsets.ViewSet,
                       generics.ListAPIView,
                       generics.RetrieveAPIView,
                       generics.CreateAPIView,
                       generics.UpdateAPIView):
    queryset = Apartment.objects.filter(active=True)
    serializer_class = ApartmentSerializer
    pagination_class = ApartmentPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['building', 'floor', 'active']
    search_fields = ['code', 'building', 'number', 'owner__email']
    ordering_fields = ['building', 'floor', 'number']

    def get_permissions(self):
        # Chỉ quản trị viên mới có quyền tạo, xóa và cập nhật căn hộ
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        query = self.queryset

        building = self.request.query_params.get('building')
        if building:
            query = query.filter(building__icontains=building)

        floor = self.request.query_params.get('floor')
        if floor:
            query = query.filter(floor=floor)

        return query

    @action(methods=['get'], detail=False, url_path='get-apartments')
    def get_apartments(self, request):
        apartments = Apartment.objects.filter(owner=request.user, active=True)
        page = self.paginate_queryset(apartments)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(apartments, many=True)
        return Response(serializer.data)

    @action(methods=['post'], detail=True, url_path='transfer', permission_classes=[permissions.IsAdminUser])
    def transfer_apartment(self, request, pk=None):
        apartment = self.get_object()

        # Kiểm tra xem người thực hiện có phải là quản trị viên không
        if not request.user.is_staff:
            return Response(
                {"detail": "Chỉ quản trị viên mới có quyền chuyển nhượng căn hộ."},
                status=status.HTTP_403_FORBIDDEN
            )

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

        # Kiểm tra xem người nhận có phải là chủ sở hữu hiện tại căn khác không
        if new_owner == apartment.owner:
            return Response({"detail": "Người nhận đã là chủ sở hữu căn hộ khác."},
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

    @action(methods=['get'], detail=True, url_path='payment-history')
    def payment_history(self, request, pk):
        apartment = self.get_object()
        payments = apartment.payments.all()
        return Response(serializers.PaymentTransactionSerializer(payments, many=True).data)


# Apartment Transfer History ViewSet
class ApartmentTransferHistoryViewSet(viewsets.ViewSet,
                                      generics.ListAPIView,
                                      generics.RetrieveAPIView,
                                      generics.CreateAPIView):
    queryset = ApartmentTransferHistory.objects.filter(active=True)
    serializer_class = ApartmentTransferHistorySerializer
    pagination_class = ApartmentPagination  # Phân trang
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['apartment', 'previous_owner', 'new_owner', 'active']
    ordering_fields = ['transfer_date', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
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
class PaymentCategoryViewSet(viewsets.ViewSet,
                             generics.ListAPIView,
                             generics.RetrieveAPIView,
                             generics.CreateAPIView,
                             generics.UpdateAPIView):
    queryset = PaymentCategory.objects.filter(active=True)
    serializer_class = serializers.PaymentCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_recurring', 'active']
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]


# Payment Transaction ViewSet
class PaymentTransactionViewSet(viewsets.ViewSet,
                                generics.ListAPIView,
                                generics.RetrieveAPIView,
                                generics.CreateAPIView,
                                generics.UpdateAPIView):
    queryset = PaymentTransaction.objects.filter(active=True)
    serializer_class = serializers.PaymentTransactionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['apartment', 'category', 'method', 'status', 'active']
    ordering_fields = ['paid_date', 'created_date', 'amount']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
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
class ParcelLockerViewSet(viewsets.ModelViewSet):
    queryset = ParcelLocker.objects.filter(active=True)
    serializer_class = ParcelLockerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resident', 'active']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update']:
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        #Nếu người dùng không phải admin, chỉ hiển thị các tủ đồ của họ
        query = super().get_queryset()
        if not self.request.user.is_staff:
            query = query.filter(resident__user=self.request.user)
        return query

    @action(methods=['get'], detail=False, url_path='my-locker')
    def my_locker(self, request):
        #Trả về tủ đồ của người dùng hiện tại
        try:
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
        #Trả về danh sách đồ trong tủ
        locker = self.get_object()
        items = locker.items.all()  # Quan hệ related_name='items' từ model
        serializer = ParcelItemSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)