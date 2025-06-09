import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apartmentmanagement.settings')
django.setup()

from django.contrib.auth import get_user_model
from apartments.models import (
    Resident, Apartment, PaymentCategory, PaymentTransaction,
    ParcelLocker, ParcelItem, Feedback, Survey, SurveyOption, SurveyResponse
)
User = get_user_model()

def get_or_create_resident(email, password, id_number, relationship_status, role='RESIDENT'):
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'role': role}
    )
    if created:
        user.set_password(password)
        user.save()
    if not hasattr(user, 'resident_profile'):
        resident = Resident.objects.create(user=user, id_number=id_number, relationship_status=relationship_status)
    else:
        resident = user.resident_profile
    return user, resident

def get_or_create_apartment(code, building, floor, number, owner):
    apt, _ = Apartment.objects.get_or_create(
        code=code,
        defaults={'building': building, 'floor': floor, 'number': number, 'owner': owner}
    )
    return apt

def seed():
    # Admin
    admin_user, _ = User.objects.get_or_create(
        email='admin16@gmail.com',
        defaults={'role': 'ADMIN', 'is_superuser': True, 'is_staff': True}
    )
    admin_user.set_password('1')
    admin_user.save()

    # Loại phí
    mgmt_fee, _ = PaymentCategory.objects.get_or_create(
        name='Phí quản lý',
        defaults={
            'amount': 300000,
            'frequency': 'MONTHLY',
            'category_type': 'SERVICE',
            'tax_percentage': 5,
            'description': 'Phí quản lý tòa nhà hàng tháng'
        }
    )

    # Khảo sát
    survey, _ = Survey.objects.get_or_create(
        title='Khảo sát ý kiến cư dân',
        defaults={
            'description': 'Bạn có hài lòng với dịch vụ hiện tại không?',
            'deadline': datetime.now() + timedelta(days=7)
        }
    )
    option1, _ = SurveyOption.objects.get_or_create(survey=survey, option_text='Hài lòng')
    option2, _ = SurveyOption.objects.get_or_create(survey=survey, option_text='Không hài lòng')

    # Danh sách cư dân mẫu
    residents_data = [
        # email, password, id_number, relationship_status, apt_code, building, floor, number, payment, parcel, feedback, survey_option
        ('ngoc@gmail.com', 'ngoc123', '987654321', 'Chủ hộ', 'A101', 'A', 1, '01', 300000, 'Bưu phẩm từ Lazada', 'Thang máy chậm', option2),
        ('minh@example.com', 'minh123', '564738291', 'Chủ hộ', 'C303', 'C', 3, '03', 300000, 'Giao hàng nhanh', 'Nước rỉ ở hành lang', option1),
        ('nhan@gmail.com', 'nhan123', '987654331', 'Chủ hộ', 'B302', 'B', 3, '02', 300000, 'Bưu phẩm từ CellphoneS', 'Hay cúp nước', option2),
        ('phuc@gmail.com', 'phuc123', '123456789', 'Chủ hộ', 'A204', 'A', 2, '04', 250000, 'Túi giao từ Shopee', 'Quạt hành lang tầng 2 bị hư', option2),
        ('nam@gmail.com', 'nam123', '567891234', 'Chủ hộ', 'C105', 'C', 1, '05', 280000, 'Thùng hàng Tiki', 'Wifi khu vực tầng 1 yếu', option2),
        ('hau@gmail.com', 'hau123', '876543219', 'Chủ hộ', 'D406', 'D', 4, '06', 320000, 'Kiện hàng Lazada', 'Hành lang có mùi lạ', option2),
        ('nhu@gmail.com', 'nhu123', '192837465', 'Chủ hộ', 'C106', 'C', 1, '06', 280000, 'Hộp mỹ phẩm từ Tiki', 'Cần thêm chỗ đậu xe máy', option2),
        ('duyen@gmail.com', 'duyen123', '246813579', 'Chủ hộ', 'D407', 'D', 4, '07', 290000, 'Hàng giao từ Lazada', 'Đèn cầu thang không sáng', option2),
        ('xuan@gmail.com', 'xuan123', '112233445', 'Chủ hộ', 'A105', 'A', 1, '05', 270000, 'Bộ sách giáo dục trẻ em', 'Thang máy bị chậm', option2),
        ('huy@gmail.com', 'huy123', '998877665', 'Chủ hộ', 'C208', 'C', 2, '08', 320000, 'Loa Bluetooth JBL', 'Cửa kính tầng trệt bị kẹt', option2),
        ('my@gmail.com', 'my123', '112233445', 'Chủ hộ', 'C305', 'C', 3, '05', 280000, 'Máy sấy tóc', 'Sân chơi trẻ em bị hư hỏng', option2),
    ]

    for idx, (email, password, id_number, relationship_status, apt_code, building, floor, number, payment, parcel, feedback, survey_option) in enumerate(residents_data, start=2):
        user, resident = get_or_create_resident(email, password, id_number, relationship_status)
        apt = get_or_create_apartment(apt_code, building, floor, number, resident)
        PaymentTransaction.objects.get_or_create(
            apartment=apt,
            category=mgmt_fee,
            transaction_id=f'TXN{idx:03}',
            defaults={
                'amount': payment,
                'method': 'MOMO' if idx % 2 == 0 else 'VNPAY',
                'status': 'COMPLETED' if idx % 2 == 0 else 'PENDING',
                'paid_date': datetime.now(),
                'transaction_fee': 1000 + idx * 100
            }
        )
        locker, _ = ParcelLocker.objects.get_or_create(resident=resident)
        ParcelItem.objects.get_or_create(
            locker=locker,
            name=parcel,
            defaults={'status': 'PENDING', 'note': f'Giao cho {email}'}
        )
        Feedback.objects.get_or_create(
            resident=resident,
            title=feedback,
            defaults={'content': f'Nội dung phản hồi của {email}', 'status': 'NEW'}
        )
        SurveyResponse.objects.get_or_create(
            survey=survey,
            option=survey_option,
            resident=resident
        )

    # Nhân viên
    staff_data = [
        ('bao@gmail.com', 'bao123', '998877665', 'Nhân viên', 'RESIDENT'),
        ('lam@gmail.com', 'lam123', '554433221', 'Nhân viên', 'RESIDENT'),
    ]
    for email, password, id_number, relationship_status, role in staff_data:
        get_or_create_resident(email, password, id_number, relationship_status, role=role)

    print("✅ Đã seed đầy đủ dữ liệu mẫu thành công!")

if __name__ == '__main__':
    seed()