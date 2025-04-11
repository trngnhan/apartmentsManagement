from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from cloudinary.models import CloudinaryField
from datetime import datetime
import calendar

# Utilities

def get_default_end_date():
    now = datetime.now()
    last_day = calendar.monthrange(now.year, now.month)[1]
    return datetime(now.year, now.month, last_day)

def current_month():
    return datetime.now().month

def current_year():
    return datetime.now().year

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
        RESIDENT = 'RESIDENT', 'Resident'

    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.RESIDENT)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    profile_picture = CloudinaryField('profiles/', null=True, blank=True)
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
    code = models.CharField(max_length=20, unique=True)
    building = models.CharField(max_length=50)
    floor = models.IntegerField()
    number = models.CharField(max_length=10)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_apartments')

    def __str__(self):
        return f'{self.building} - Tầng {self.floor} - Căn {self.number}'

# Apartment Transfer
class ApartmentTransferHistory(BaseModel):
    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='transfer_history')
    previous_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='previous_apartment_owners')
    new_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='new_apartment_owners')
    transfer_date = models.DateField(default=datetime.now)
    note = models.TextField(blank=True, null=True)

# Payment Category
class PaymentCategory(BaseModel):
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_recurring = models.BooleanField(default=True)
    description = models.TextField(blank=True, null=True)

# Payment Transaction
class PaymentTransaction(BaseModel):
    class Method(models.TextChoices):
        MOMO = 'MOMO', 'MoMo'
        VNPAY = 'VNPAY', 'VNPay'
        BANK = 'BANK', 'Bank Transfer'

    apartment = models.ForeignKey(Apartment, on_delete=models.CASCADE, related_name='payments')
    category = models.ForeignKey(PaymentCategory, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=20, choices=Method.choices)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, default='PENDING')
    payment_proof = CloudinaryField('payments/', null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)

# Firebase Token
class FirebaseToken(BaseModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='firebase_token')
    token = models.CharField(max_length=255)

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
