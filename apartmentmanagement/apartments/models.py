from cloudinary.utils import now
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from cloudinary.models import CloudinaryField
from datetime import datetime
import calendar

# Base Model
class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-created_date']

# User Management
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser, BaseModel):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Admin'
        MANAGEMENT = 'MANAGEMENT', 'Management'
        RESIDENT = 'RESIDENT', 'Resident'

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.RESIDENT)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    profile_picture = CloudinaryField(null=True, blank=True)
    must_change_password = models.BooleanField(default=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    #Sử dụng UserManager để định nghĩa lại phương thức tạo user và superuser.
    objects = UserManager()

    def __str__(self):
        return self.email

# Resident Profile
class Resident(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='resident_profile')
    id_number = models.CharField(max_length=20, blank=True, null=True)
    relationship_status = models.CharField(max_length=50, blank=True, null=True)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Cư dân: {self.user.email}"

# Apartment
class Apartment(BaseModel):
    class Building(models.TextChoices):
        A = 'A', 'Tòa A'
        B = 'B', 'Tòa B'
        C = 'C', 'Tòa C'
        D = 'D', 'Tòa D'

    code = models.CharField(max_length=20, unique=True)
    building = models.CharField(max_length=1, choices=Building.choices)
    floor = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(20)])
    number = models.CharField(max_length=10)
    owner = models.ForeignKey(Resident, on_delete=models.SET_NULL, null=True, related_name='owned_apartments')

    def __str__(self):
        return f'{self.building} - Tầng {self.floor} - Căn {self.number}'

# Apartment Transfer
class ApartmentTransferHistory(BaseModel):
    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='transfer_history')
    previous_owner = models.ForeignKey(Resident, on_delete=models.SET_NULL, null=True, related_name='previous_apartment_owners')
    new_owner = models.ForeignKey(Resident, on_delete=models.SET_NULL, null=True, related_name='new_apartment_owners')
    transfer_date = models.DateField(default=datetime.now)
    note = models.TextField(blank=True, null=True)

# Payment Category: định nghĩa, quản lý các loại phí
class PaymentCategory(BaseModel):
    name = models.CharField(max_length=100)  # Tên loại thanh toán, ví dụ "Phí quản lý", "Phí gửi xe"
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Số tiền phải thanh toán
    is_recurring = models.BooleanField(
        default=True)  # Liệu đây có phải là loại phí định kỳ không (như hàng tháng, hàng năm...)
    description = models.TextField(blank=True, null=True)  # Mô tả chi tiết về loại phí
    FREQUENCY_CHOICES = [
        ('ONE_TIME', 'Một lần'),
        ('MONTHLY', 'Hàng tháng'),
        ('QUARTERLY', 'Hàng quý'),
        ('YEARLY', 'Hàng năm'),
    ]
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='MONTHLY')  # Tần suất thanh toán
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2,
                                         default=0)  # Phần trăm thuế phải trả cho loại phí này
    grace_period = models.IntegerField(default=0)
    category_type = models.CharField(
        max_length=50,
        choices=[('MAINTENANCE', 'Bảo trì'), ('UTILITY', 'Tiện ích'), ('SERVICE', 'Dịch vụ')],
        default='MAINTENANCE'
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)

    def save(self, *args, **kwargs):
        self.total_amount = self.amount + (self.amount * self.tax_percentage / 100)
        super().save(*args, **kwargs)

    def __str__(self):
        formatted_amount = f"{self.total_amount:,.0f}".replace(',', '.')
        return f"{self.name} - {formatted_amount} VND"

# Payment Transaction
class PaymentTransaction(BaseModel):
    class Method(models.TextChoices):
        MOMO = 'MOMO', 'MoMo'
        VNPAY = 'VNPAY', 'VNPay'
        BANK = 'BANK', 'Bank Transfer'
        CASH = 'CASH', 'Cash Payment'

    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='payments')
    category = models.ForeignKey(PaymentCategory, on_delete=models.SET_NULL, null=True)  # Loại phí này thuộc về đâu
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Số tiền giao dịch
    method = models.CharField(max_length=20, choices=Method.choices)  # Phương thức thanh toán (MoMo, VNPay, v.v.)
    transaction_id = models.CharField(max_length=100, blank=True,
                                      null=True)  # ID giao dịch (tùy theo phương thức thanh toán)
    status = models.CharField(max_length=20, default='PENDING')  # Trạng thái thanh toán (Chờ xử lý, Đã thanh toán...)
    payment_proof = CloudinaryField(null=True, blank=True)  # Hình ảnh chứng từ thanh toán (chứng từ thanh toán)
    paid_date = models.DateTimeField(null=True, blank=True)  # Thời gian thanh toán (nếu đã thanh toán)
    transaction_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Phí giao dịch (nếu có)

    STATUS_CHOICES = [
        ('PENDING', 'Chờ xử lý'),
        ('COMPLETED', 'Hoàn tất'),
        ('FAILED', 'Thất bại'),
        ('REFUNDED', 'Đã hoàn lại'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES,
                              default='PENDING')  # Trạng thái giao dịch thanh toán

    def __str__(self):
        # Định dạng số tiền
        formatted_amount = f"{self.amount:,.0f}".replace(',', '.')
        return f"Transaction {self.transaction_id} - {self.status} - {formatted_amount} VND"

    def process_payment(self):
        # Phương thức này có thể được sử dụng để xử lý logic thanh toán, ví dụ như chuyển trạng thái giao dịch
        # từ PENDING sang COMPLETED nếu thanh toán thành công.
        if self.status == 'PENDING':
            self.status = 'COMPLETED'
            self.paid_date = now()
            self.save()

# Parcel Locker
class ParcelLocker(BaseModel):
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name='locker_items')

class ParcelItem(BaseModel):
    locker = models.ForeignKey(ParcelLocker, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, choices=[('PENDING', 'Chờ nhận'), ('RECEIVED', 'Đã nhận')], default='PENDING')
    note = models.TextField(blank=True, null=True)

# Feedback
class Feedback(BaseModel):
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name='feedbacks')
    title = models.CharField(max_length=255)
    content = models.TextField()
    status = models.CharField(max_length=50, choices=[('NEW', 'Mới'), ('PROCESSING', 'Đang xử lý'), ('RESOLVED', 'Đã xử lý')], default='NEW')

# Survey
class Survey(BaseModel):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    deadline = models.DateTimeField()

class SurveyOption(BaseModel):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name='options')
    option_text = models.CharField(max_length=255)

class SurveyResponse(BaseModel):
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE)
    option = models.ForeignKey(SurveyOption, on_delete=models.CASCADE)
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE)

# Visitor Vehicle Registration
class VisitorVehicleRegistration(BaseModel):
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE)
    visitor_name = models.CharField(max_length=100)
    vehicle_number = models.CharField(max_length=20)
    registration_date = models.DateField(auto_now_add=True)
    approved = models.BooleanField(default=False)
