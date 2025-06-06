from cloudinary.utils import now
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash, authenticate, login, get_user_model
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.urls import reverse
from rest_framework import viewsets, generics, permissions, status, parsers, renderers
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, NotFound
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAdminUser
from rest_framework.views import APIView
from django.utils.timezone import now
from .permissions import IsAdminRole, IsAdminOrSelf, IsAdminOrManagement
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .pagination import Pagination
from apartments import serializers

from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import PaymentCategory, PaymentTransaction, Apartment
from .serializers import PaymentCategorySerializer, PaymentTransactionSerializer
import hashlib
import hmac
import requests
import time
from decouple import config
from django.utils import timezone
import logging
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json

from apartments.serializers import UserSerializer, ResidentSerializer, ApartmentSerializer, \
    ApartmentTransferHistorySerializer, ParcelItemSerializer, ParcelLockerSerializer, \
    FeedbackSerializer, SurveySerializer, SurveyOptionSerializer, SurveyResponseSerializer, \
    VisitorVehicleRegistrationSerializer
from .models import (
    Resident, Apartment, ApartmentTransferHistory, PaymentCategory,
    PaymentTransaction, ParcelLocker, ParcelItem,
    Feedback, Survey, SurveyOption, SurveyResponse, VisitorVehicleRegistration
)
from .sms import send_sms

User = get_user_model()

class UserViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering_fields = ['email', 'date_joined']
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        if 'active' in request.data:
            user.active = request.data['active']
        user.save()
        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='unregistered-users')
    def unregistered_users(self, request):
        # Lấy danh sách user chưa liên kết với resident
        unregistered_users = User.objects.filter(
            resident_profile__isnull=True,
            active=True,
            is_superuser=False
        )
        serializer = self.get_serializer(unregistered_users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='admins')
    def get_admins(self, request):
        # Lọc các user có role là ADMIN
        admins = User.objects.filter(role='ADMIN', active=True)

        if not admins.exists():
            return Response({"detail": "Không tìm thấy Admin nào."}, status=404)

        # Nếu bạn chỉ cần ID của admin đầu tiên
        first_admin = admins.first()
        return Response({
            "admin_id": first_admin.id,
            "admin_name": f"{first_admin.first_name} {first_admin.last_name}",
            "admin_email": first_admin.email
        })

    @action(methods=['get', 'patch'], url_path='current-user', detail=False,
            permission_classes=[permissions.IsAuthenticated],
            parser_classes=[MultiPartParser, FormParser])
    def get_current_user(self, request):
        u = request.user

        # Xử lý PATCH nếu cần
        if request.method == 'PATCH':
            for k, v in request.data.items():
                if k in ['first_name', 'last_name']:
                    setattr(u, k, v)
                elif k == 'password':
                    u.set_password(v)
                elif k == 'must_change_password':
                    u.must_change_password = v.lower() == 'true' if isinstance(v, str) else bool(v)

            # Xử lý file ảnh
            if 'profile_picture' in request.FILES:
                u.profile_picture = request.FILES['profile_picture']

            u.save()

        # Sử dụng UserSerializer để trả về dữ liệu
        serializer = UserSerializer(u)
        return Response(serializer.data)

class ResidentViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = Resident.objects.filter(active=True)
    serializer_class = ResidentSerializer
    pagination_class = PageNumberPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['active']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'id_number']

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAdminRole()]
        elif self.action in ['update', 'partial_update', 'retrieve']:
            return [IsAdminOrSelf()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['get'], url_path='count-resident')
    def count_resident(self, request):
        count = Resident.objects.filter(active=True).count()
        return Response({'count': count}, status=status.HTTP_200_OK)

    @action(methods=['get', 'patch'], url_path='current-resident', detail=False,
            permission_classes=[permissions.IsAuthenticated])
    def get_current_resident(self, request):
        # Lấy thông tin cư dân liên kết với người dùng hiện tại
        resident = Resident.objects.filter(user=request.user).first()
        if not resident:
            return Response(
                {"detail": "Không tìm thấy thông tin cư dân cho người dùng này."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Xử lý PATCH nếu cần
        if request.method == 'PATCH':
            serializer = self.get_serializer(resident, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        # Trả về thông tin cư dân
        serializer = self.get_serializer(resident)
        return Response(serializer.data)

# Apartment ViewSet
class ApartmentViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
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
        query = self.queryset.filter()

        building = self.request.query_params.get('building')
        if building:
            query = query.filter(building__icontains=building)

        floor = self.request.query_params.get('floor')
        if floor:
            query = query.filter(floor=floor)

        return query

    @action(detail=False, methods=['get'], url_path='total-apartments')
    def total_apartments(self, request):
        total_apartments = Apartment.objects.filter(active=True).count()
        return Response({"count": total_apartments}, status=status.HTTP_200_OK)

    @action(methods=['get'], detail=False, url_path='resident-without-apartment')
    def get_resident_without_apartment(self, request):
        # Lọc cư dân chưa sở hữu căn hộ
        residents = User.objects.filter(owned_apartments__isnull=True, role=User.Role.RESIDENT, active=True)

        # Serialize dữ liệu
        data = [
            {
                "id": resident.id,
                "first_name": resident.first_name,
                "last_name": resident.last_name,
                "email": resident.email,
            }
            for resident in residents
        ]

        # Trả về danh sách cư dân
        return Response(data, status=status.HTTP_200_OK)


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


# # Payment Category ViewSet
# class PaymentCategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
#     queryset = PaymentCategory.objects.filter()
#     serializer_class = serializers.PaymentCategorySerializer
#     filter_backends = [DjangoFilterBackend, SearchFilter]
#     filterset_fields = ['is_recurring', 'active']
#     search_fields = ['name', 'description']
#
#     def get_permissions(self):
#         if self.action in ['create', 'update', 'partial_update', 'list']:
#             return [IsAdminUser()]
#         return [IsAdminOrManagement()]
#
#
# # Payment Transaction ViewSet
# class PaymentTransactionViewSet(viewsets.ViewSet, generics.ListAPIView):
#     queryset = PaymentTransaction.objects.filter(active=True)
#     serializer_class = serializers.PaymentTransactionSerializer
#     filter_backends = [DjangoFilterBackend, OrderingFilter]
#     filterset_fields = ['apartment', 'category', 'method', 'status', 'active']
#     ordering_fields = ['paid_date', 'created_date', 'amount']
#
#     def get_permissions(self):
#         if self.action in ['create', 'update', 'partial_update']:
#             return [IsAdminUser()]
#         if self.action in ['list', 'retrieve']:
#             return [IsAdminOrManagement()]
#         return [permissions.IsAuthenticated()]
#
#     def get_queryset(self):
#         #Nếu người dùng không phải admin, chỉ hiển thị các giao dịch của căn hộ mà họ sở hữu
#         query = self.queryset
#         if not self.request.user.is_staff:
#             query = query.filter(apartment__owner=self.request.user)
#
#         status_param = self.request.query_params.get('status')
#         if status_param:
#             query = query.filter(status=status_param)
#
#         return query
#
#     @action(methods=['post'], detail=True, url_path='upload-proof', parser_classes=[parsers.MultiPartParser])
#     def upload_proof(self, request, pk):
#         #Tải lên bằng chứng thanh toán
#         transaction = self.get_object()
#         if transaction.apartment.owner != request.user and not request.user.is_staff:
#             return Response(
#                 {"detail": "Bạn không có quyền thực hiện hành động này."},
#                 status=status.HTTP_403_FORBIDDEN
#             )
#
#         if 'payment_proof' not in request.data:
#             return Response(
#                 {"detail": "Không tìm thấy file bằng chứng thanh toán."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         transaction.payment_proof = request.data['payment_proof']
#         transaction.status = 'PENDING'
#         transaction.save()
#
#         return Response(self.get_serializer(transaction).data)
#
#     @action(methods=['patch'], detail=True, url_path='update-payment', permission_classes=[IsAdminUser])
#     def update_payment(self, request, pk=None):
#         transaction = self.get_object()
#         new_status = request.data.get("status")
#         if new_status not in ["PENDING", "COMPLETED", "FAILED", "REFUNDED"]:
#             return Response(
#                 {"detail": "Trạng thái không hợp lệ."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#         transaction.status = new_status
#         transaction.save()
#         return Response(
#             {"detail": f"Trạng thái đã được cập nhật thành {new_status}."},
#             status=status.HTTP_200_OK
#         )

# Payment Category ViewSet
class PaymentCategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView):
    queryset = PaymentCategory.objects.filter(active=True)
    serializer_class = serializers.PaymentCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_recurring', 'active']
    search_fields = ['name', 'description']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return self.queryset


# Payment Transaction ViewSet
# class PaymentTransactionViewSet(viewsets.ViewSet):
#     queryset = PaymentTransaction.objects.filter(active=True)
#     serializer_class = serializers.PaymentTransactionSerializer
#     filter_backends = [DjangoFilterBackend, OrderingFilter]
#     filterset_fields = ['apartment', 'category', 'method', 'status', 'active']
#     ordering_fields = ['paid_date', 'created_date', 'amount']
#
#     def get_permissions(self):
#         if self.action in ['create', 'update', 'partial_update']:
#             return [IsAdminUser()]
#         if self.action in ['list', 'retrieve']:
#             return [IsAdminOrManagement()]
#         return [permissions.IsAuthenticated()]
#
#     def get_queryset(self):
#         #Nếu người dùng không phải admin, chỉ hiển thị các giao dịch của căn hộ mà họ sở hữu
#         query = self.queryset
#         if not self.request.user.is_staff:
#             query = query.filter(apartment__owner=self.request.user)
#
#         status_param = self.request.query_params.get('status')
#         if status_param:
#             query = query.filter(status=status_param)
#
#         return query
#
#     @action(methods=['get'], detail=False, url_path='my-payments')
#     def my_payments(self, request):
#        #Trả về danh sách giao dịch thanh toán của người dùng hiện tại
#         payments = PaymentTransaction.objects.filter(apartment__owner=request.user)
#         serializer = self.get_serializer(payments, many=True)
#         return Response(serializer.data)
#
#     @action(methods=['post'], detail=True, url_path='upload-proof', parser_classes=[parsers.MultiPartParser])
#     def upload_proof(self, request, pk):
#         #Tải lên bằng chứng thanh toán
#         transaction = self.get_object()
#         if transaction.apartment.owner != request.user and not request.user.is_staff:
#             return Response(
#                 {"detail": "Bạn không có quyền thực hiện hành động này."},
#                 status=status.HTTP_403_FORBIDDEN
#             )
#
#         if 'payment_proof' not in request.data:
#             return Response(
#                 {"detail": "Không tìm thấy file bằng chứng thanh toán."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         transaction.payment_proof = request.data['payment_proof']
#         transaction.status = 'PENDING'
#         transaction.save()
#
#         return Response(self.get_serializer(transaction).data)
#
#     @action(methods=['patch'], detail=True, url_path='update-payment', permission_classes=[IsAdminUser])
#     def mark_completed(self, request, pk=None):
#         transaction = self.get_object()
#
#         if transaction.status == 'COMPLETED':
#             return Response(
#                 {"detail": "Giao dịch này đã hoàn tất."},
#                 status=status.HTTP_400_BAD_REQUEST
#             )
#
#         transaction.status = 'COMPLETED'
#         transaction.save()
#
#         return Response(
#             {"detail": "Giao dịch đã được đánh dấu là hoàn tất."},
#             status=status.HTTP_200_OK
#         )

logger = logging.getLogger('__name__')

class IsAdminOrManagement(IsAuthenticated):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or
                request.user.groups.filter(name='Management').exists())

class PaymentCategoryViewSet(viewsets.ViewSet, generics.ListCreateAPIView, generics.UpdateAPIView):
    queryset = PaymentCategory.objects.filter()
    serializer_class = PaymentCategorySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_recurring', 'active']
    search_fields = ['amount', 'description']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return self.queryset

class PaymentTransactionViewSet(viewsets.GenericViewSet):
    queryset = PaymentTransaction.objects.filter(active=True)
    serializer_class = PaymentTransactionSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['apartment', 'category', 'method', 'status', 'active']
    ordering_fields = ['paid_date', 'created_date', 'amount']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'mark_completed']:
            return [IsAdminUser()]
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrManagement()]
        return [IsAuthenticated()]

    def get_queryset(self):
        query = self.queryset
        if not self.request.user.is_staff:
            query = query.filter(apartment__owner=self.request.user)
        status_param = self.request.query_params.get('status')
        if status_param:
            query = query.filter(status=status_param)
        return query

    @action(methods=['get'], detail=False, url_path='my-payments')
    def my_payments(self, request):
        payments = PaymentTransaction.objects.filter(apartment__owner=self.request.user)
        serializer = self.get_serializer(payments, many=True)
        logger.info(f"Returning {len(payments)} transactions for user {self.request.user.username}")
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='transaction/(?P<transaction_id>[^/.]+)')
    def get_transaction(self, request, transaction_id=None):
        try:
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id,
                apartment__owner=self.request.user
            )
            serializer = self.get_serializer(transaction)
            logger.info(f"Retrieved transaction {transaction_id} for user {self.request.user.username}")
            return Response(serializer.data)
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Transaction {transaction_id} not found for user {self.request.user.username}")
            return Response({"detail": "Không tìm thấy giao dịch"}, status=status.HTTP_404_NOT_FOUND)

    @action(methods=['post'], detail=True, url_path='create-momo-payment', permission_classes=[IsAuthenticated])
    def create_momo_payment(self, request, pk=None):
        try:
            category = PaymentCategory.objects.get(pk=pk, active=True)
            try:
                apartment = Apartment.objects.get(owner=self.request.user)
            except Apartment.DoesNotExist:
                return Response(
                    {"detail": "Người dùng không sở hữu căn hộ nào."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Kiểm tra giao dịch định kỳ
            if category.is_recurring and category.frequency == 'MONTHLY':
                now = timezone.now()
                existing_transaction = PaymentTransaction.objects.filter(
                    apartment=apartment,
                    category=category,
                    status='COMPLETED',
                    paid_date__year=now.year,
                    paid_date__month=now.month
                ).exists()
                if existing_transaction:
                    return Response(
                        {"detail": "Khoản phí này đã được thanh toán cho chu kỳ hiện tại."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # MoMo configuration
            partner_code = "MOMO"
            order_id = f"{partner_code}{int(time.time() * 1000)}"
            request_id = order_id
            access_key = config('MOMO_ACCESS_KEY', default='F8BBA842ECF85')
            secret_key = config('MOMO_SECRET_KEY', default='K951B6PE1waDMi640xX08PD3vg6EkVlz')
            redirect_url = "apartmentmanagement://payment-callback"
            ipn_url = 'https://<your-ngrok-id>.ngrok-free.app/paymenttransactions/momo-ipn/'  # Thay bằng ngrok URL
            request_type = "captureWallet"
            amount = str(int(category.amount))
            order_info = f"Thanh toán {category.name}"
            extra_data = ""
            lang = "vi"

            logger.info(f"Using ipn_url: {ipn_url}")

            # Tạo raw signature đúng theo MoMo
            raw_signature = (
                f"accessKey={access_key}&amount={amount}&extraData={extra_data}"
                f"&ipnUrl={ipn_url}&orderId={order_id}&orderInfo={order_info}"
                f"&partnerCode={partner_code}&redirectUrl={redirect_url}"
                f"&requestId={request_id}&requestType={request_type}"
            )
            logger.info(f"Raw signature: {raw_signature}")

            signature = hmac.new(
                key=secret_key.encode('utf-8'),
                msg=raw_signature.encode('utf-8'),
                digestmod=hashlib.sha256
            ).hexdigest()

            # Tạo request body
            request_body = {
                "partnerCode": partner_code,
                "partnerName": "Test",
                "storeId": "MomoTestStore",
                "requestId": request_id,
                "amount": amount,
                "orderId": order_id,
                "orderInfo": order_info,
                "redirectUrl": redirect_url,
                "ipnUrl": ipn_url,
                "lang": lang,
                "requestType": request_type,
                "extraData": extra_data,
                "signature": signature
            }

            # Gửi yêu cầu tới MoMo
            logger.info(f"Sending MoMo request: {request_body}")
            response = requests.post(
                "https://test-payment.momo.vn/v2/gateway/api/create",
                headers={"Content-Type": "application/json"},
                json=request_body,
                timeout=30  # Tăng timeout
            )
            response.raise_for_status()
            momo_response = response.json()
            logger.info(f"MoMo response: {momo_response}")

            if not momo_response.get('qrCodeUrl'):
                logger.error("No qrCodeUrl in MoMo response")
                return Response({"detail": "MoMo API không trả về QR Code"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            transaction = PaymentTransaction.objects.create(
                apartment=apartment,
                category=category,
                amount=category.amount,
                method=PaymentTransaction.Method.MOMO,
                transaction_id=order_id,
                status='PENDING'
            )

            return Response({
                "transaction": PaymentTransactionSerializer(transaction).data,
                "momo_response": momo_response
            }, status=status.HTTP_200_OK)

        except PaymentCategory.DoesNotExist:
            return Response({"detail": "Không tìm thấy loại phí"}, status=status.HTTP_404_NOT_FOUND)
        except requests.RequestException as e:
            logger.error(f"MoMo API error: {str(e)}")
            return Response({"detail": f"Lỗi khi gọi MoMo API: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(methods=['post'], detail=False, url_path='update-status', permission_classes=[IsAuthenticated])
    def update_status(self, request):
        transaction_id = request.data.get('transaction_id')
        result_code = request.data.get('result_code')
        try:
            transaction = PaymentTransaction.objects.get(
                transaction_id=transaction_id,
                apartment__owner=self.request.user
            )
            if result_code == '0':
                transaction.status = 'COMPLETED'
                transaction.paid_date = timezone.now()
            else:
                transaction.status = 'FAILED'
            transaction.save()
            logger.info(f"Transaction {transaction_id} updated via API, status: {transaction.status}")
            return Response({"message": "Cập nhật trạng thái thành công"}, status=status.HTTP_200_OK)
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Transaction {transaction_id} not found for user {self.request.user.username}")
            return Response({"detail": "Không tìm thấy giao dịch"}, status=status.HTTP_404_NOT_FOUND)

@csrf_exempt
@require_POST
def momo_ipn(request):
    try:
        logger.info(f"IPN request received: {request.body}")
        data = json.loads(request.body)
        secret_key = settings.MOMO_SECRET_KEY

        # Kiểm tra các trường bắt buộc
        required_fields = ['partnerCode', 'orderId', 'requestId', 'amount', 'resultCode', 'signature']
        if not all(field in data for field in required_fields):
            logger.error(f"Missing required fields in IPN data: {data}")
            return JsonResponse({"message": "Dữ liệu không đầy đủ"}, status=400)

        raw_signature = (
            f"accessKey={data.get('accessKey')}&amount={data.get('amount')}"
            f"&extraData={data.get('extraData')}&message={data.get('message')}"
            f"&orderId={data.get('orderId')}&orderInfo={data.get('orderInfo')}"
            f"&orderType={data.get('orderType')}&partnerCode={data.get('partnerCode')}"
            f"&payType={data.get('payType')}&requestId={data.get('requestId')}"
            f"&responseTime={data.get('responseTime')}&resultCode={data.get('resultCode')}"
            f"&transId={data.get('transId')}"
        )
        signature = hmac.new(
            key=secret_key.encode('utf-8'),
            msg=raw_signature.encode('utf-8'),
            digestmod=hashlib.sha256
        ).hexdigest()

        if signature != data.get('signature'):
            logger.error(f"Invalid signature. Expected: {signature}, Received: {data.get('signature')}")
            return JsonResponse({"message": "Chữ ký không hợp lệ"}, status=400)

        try:
            transaction = PaymentTransaction.objects.get(transaction_id=data.get('orderId'))
        except PaymentTransaction.DoesNotExist:
            logger.error(f"Transaction not found for orderId: {data.get('orderId')}")
            return JsonResponse({"message": "Giao dịch không tồn tại"}, status=404)

        logger.info(f"Processing IPN for transaction: {transaction.transaction_id}, resultCode: {data.get('resultCode')}")
        transaction.status = 'COMPLETED' if str(data.get('resultCode')) == '0' else 'FAILED'
        transaction.paid_date = timezone.now() if transaction.status == 'COMPLETED' else transaction.paid_date
        transaction.save()
        logger.info(f"Transaction updated: {transaction.transaction_id}, status: {transaction.status}")

        return JsonResponse({"message": "IPN nhận thành công"}, status=200)
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in IPN: {str(e)}")
        return JsonResponse({"message": "Dữ liệu JSON không hợp lệ"}, status=400)
    except Exception as e:
        logger.error(f"IPN error: {str(e)}")
        return JsonResponse({"message": f"Lỗi server: {str(e)}"}, status=500)

# Parcel Locker ViewSet
class ParcelLockerViewSet(viewsets.ViewSet, generics.ListCreateAPIView, APIView):
    queryset = ParcelLocker.objects.filter(active=True)
    serializer_class = ParcelLockerSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['resident', 'active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminRole()]
        if self.action in ['add-item', 'update-item-status', 'list', 'retrieve']:
            return [IsAdminOrManagement()]
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

    @action(methods=['get'], detail=False, url_path='resident-without-locker')
    def get_resident_without_locker(self, request):
        # Lấy danh sách id các Resident đã có tủ đồ
        residents_with_lockers = ParcelLocker.objects.values_list('resident_id', flat=True)

        # Lọc Resident chưa có tủ đồ
        residents = Resident.objects.filter(
            user__role=User.Role.RESIDENT,
            user__active=True
        ).exclude(id__in=residents_with_lockers)

        # Trả về Resident.id và thông tin từ user
        data = [
            {
                "id": resident.id,
                "email": resident.user.email,
            }
            for resident in residents
        ]

        return Response(data, status=status.HTTP_200_OK)

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

    @action(methods=['post'], detail=True, url_path='add-item')
    def add_item(self, request, pk=None):
        locker = self.get_object()
        item_name = request.data.get('item_name')
        note = request.data.get('note', '')
        if not item_name:
            return Response({"detail": "Tên món đồ là bắt buộc."}, status=status.HTTP_400_BAD_REQUEST)

        item = locker.items.create(name=item_name, note=note)
        serializer = ParcelItemSerializer(item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(methods=['post'], detail=False, url_path='send-sms')
    def send_sms(self, request):
        """
        API để gửi SMS.
        """
        phone_number = request.data.get('phone_number')
        message = request.data.get('message')

        if not phone_number or not message:
            return Response({"detail": "Số điện thoại và nội dung tin nhắn là bắt buộc."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Gửi SMS (giả sử bạn đã có hàm send_sms)
            send_sms(phone_number, message)
            return Response({"detail": "SMS đã được gửi thành công."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

            # if item.status != 'PENDING':
            #     return Response(
            #         {"detail": "Chỉ có thể chuyển trạng thái từ PENDING sang trạng thái khác."},
            #         status=status.HTTP_400_BAD_REQUEST
            #     )

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
        elif self.action in ['update', 'partial_update', 'list', 'update-status']:
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

    @action(methods=['patch'], detail=True, url_path='update-status')
    def update_status(self, request, pk=None):
        try:
            feedback = Feedback.objects.get(pk=pk, active=True)
        except Feedback.DoesNotExist:
            return Response(
                {"detail": "Không tìm thấy phản hồi."},
                status=status.HTTP_404_NOT_FOUND
            )

        new_status = request.data.get('status')
        if not new_status:
            return Response(
                {"detail": "Thiếu dữ liệu 'status'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        feedback.status = new_status
        feedback.save()

        return Response(
            {"detail": "Cập nhật trạng thái thành công.", "status": feedback.status},
            status=status.HTTP_200_OK
        )

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
class SurveyViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Survey.objects.filter(active=True)
    serializer_class = SurveySerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['active']
    search_fields = ['title', 'description', 'deadline']
    ordering_fields = ['deadline', 'created_date']

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'update', 'partial_update', 'post']:
            return [IsAdminOrManagement()]
        elif self.action == 'list':
            return [permissions.IsAuthenticated()]
        elif self.action in ['get-responses']:
            return [IsAdminOrManagement()]
        return [permissions.IsAuthenticated()]

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

    @action(detail=True, methods=['get'], url_path='response-rate')
    def response_rate(self, request, pk=None):
        survey = self.get_object()

        total_responses = SurveyResponse.objects.filter(survey=survey).count()

        total_invited = Resident.objects.count()

        response_rate = (total_responses / total_invited) * 100 if total_invited else 0

        return Response({'response_rate': response_rate})

    @action(methods=['get'], detail=True, url_path='get-options')
    def get_options(self, request, pk):
        survey = self.get_object()
        options = survey.options.filter(active=True)
        return Response(SurveyOptionSerializer(options, many=True).data)

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
class SurveyOptionViewSet(viewsets.ViewSet, generics.ListAPIView, generics.RetrieveAPIView):
    queryset = SurveyOption.objects.filter()
    serializer_class = SurveyOptionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['survey', 'active']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAdminOrManagement()]
        if self.action in ['destroy']:
            return [IsAdminRole]
        return [permissions.IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        survey_id = request.data.get('id') or request.data.get('surveyId')
        option_text = request.data.get('option_text')

        if not survey_id or not option_text:
            return Response({"error": "Thiếu thông tin bắt buộc."}, status=400)

        survey = get_object_or_404(Survey, id=survey_id)
        option = SurveyOption.objects.create(survey=survey, option_text=option_text)
        print("Dữ liệu nhận được:", request.data)
        print("Token nhận được:", request.headers.get('Authorization'))
        return Response(SurveyOptionSerializer(option).data, status=201)


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

    @action(methods=['patch'], detail=True, url_path='set-approval')
    def set_approval(self, request, pk):
        """
        Cập nhật trạng thái approved (duyệt hoặc từ chối) cho đăng ký giữ xe.
        Truyền {"approved": true} hoặc {"approved": false} trong body.
        """
        registration = self.get_object()

        # Kiểm tra quyền
        if not request.user.is_staff and getattr(request.user, 'role', '') != 'MANAGEMENT':
            return Response(
                {"detail": "Bạn không có quyền thực hiện hành động này."},
                status=status.HTTP_403_FORBIDDEN
            )

        approved = request.data.get("approved", None)
        if approved is None:
            return Response(
                {"detail": "Thiếu trường approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        registration.approved = approved
        registration.save()
        serializer = self.get_serializer(registration)
        return Response(serializer.data)

    @action(methods=['get'], detail=False, url_path='my-registrations')
    def my_registrations(self, request):
        #Trả về danh sách đăng ký xe của người dùng hiện tại
        registrations = VisitorVehicleRegistration.objects.filter(resident__user=request.user)
        serializer = self.get_serializer(registrations, many=True)
        return Response(serializer.data)