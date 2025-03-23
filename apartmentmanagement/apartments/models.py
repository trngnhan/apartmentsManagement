from django.contrib.auth.models import AbstractUser
from django.db import models
from cloudinary.models import CloudinaryField

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class User(AbstractUser):
    avatar = CloudinaryField(null=True)
    phone = models.CharField(max_length=11, unique=True, null=True)

    def __str__(self):
        return self.username

class Resident(BaseModel): #Quản lý cư dân
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="residents")
    apartment_number = models.CharField(max_length=11, unique=True)

    def __str__(self):
        return f"{self.user.username} - Căn hộ {self.apartment_number}"

class Payment(BaseModel): #Thanh toán
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=[("momo", "MoMo"),
                                                              ("vnpay", "VNPay")])
    transaction_id = models.CharField(max_length=100, unique=True)
    receipt = CloudinaryField('receipts/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=[("pending", "Chờ duyệt"),
                                                      ("completed", "Hoàn tất"),
                                                      ("failed", "Thất bại")], default="pending")

    def __str__(self):
        return f"{self.resident.user.username} - {self.amount} VNĐ - {self.status}"

class Invoice(BaseModel): #Quản lý hoá đơn
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="invoices")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return (f"Hóa đơn {self.id} - {self.resident.user.username} "
                f"- {'Đã thanh toán' if self.is_paid else 'Chưa thanh toán'}")

class ParkingRegistration(BaseModel): #Đăng ký giữ xe
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="parking_registrations")
    vehicle_type = models.CharField(max_length=20, choices=[("car", "Ô tô"), ("motorbike", "Xe máy")])
    license_plate = models.CharField(max_length=20, unique=True)
    status = models.CharField(max_length=20, choices=[("pending", "Chờ duyệt"),
                                                      ("approved", "Đã duyệt"),
                                                      ("rejected", "Từ chối")], default="pending")

    def __str__(self):
        return f"{self.license_plate} - {self.status}"

class Locker(BaseModel): #Quản lý tủ đồ
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="lockers")
    package_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[("pending", "Chờ nhận"),
                                                      ("received", "Đã nhận")], default="pending")

    def __str__(self):
        return f"{self.package_name} - {self.status}"

class Feedback(BaseModel): #Phản ánh
    resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="feedbacks")
    content = models.TextField()

    def __str__(self):
        return f"Phản ánh từ {self.resident.user.username}"

class Survey(BaseModel): #Khảo sát
    question = models.TextField()

    def __str__(self):
        return self.question

# class SurveyResponse(BaseModel):
#     survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="responses")
#     resident = models.ForeignKey(Resident, on_delete=models.CASCADE, related_name="survey_responses")
#     answer = models.CharField(max_length=255)
#
#     def __str__(self):
#         return f"{self.resident.user.username} - {self.answer}"
