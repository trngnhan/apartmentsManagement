import os
import django
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'apartmentmanagement.settings')
django.setup()

from apartments.models import (
    User, Resident, Apartment, ApartmentTransferHistory,
    PaymentCategory, PaymentTransaction, FirebaseToken,
    ParcelLocker, ParcelItem, Feedback,
    Survey, SurveyOption, SurveyResponse,
    VisitorVehicleRegistration
)

#Thêm 1 admin, 2 staff và các cư dân tự động vào SQL

def seed():
    admin_user, created = User.objects.get_or_create(
        email='admin16@gmail.com',
        defaults={
            'role': 'ADMIN',
            'is_superuser': True,
            'is_staff': True
        }
    )
    if created:
        admin_user.set_password('1')
        admin_user.save()

    # Tạo resident user
    resident_user, created = User.objects.get_or_create(
        email='admin@gmail.com',
        defaults={'password': 'resident123', 'role': 'RESIDENT'}
    )
    if created:
        resident_user.set_password('1')
        resident_user.save()

    if not hasattr(resident_user, 'resident_profile'):
        admin_profile = Resident.objects.create(user=resident_user, id_number='123456789', relationship_status='Admin')
    else:
        admin_profile = resident_user.resident_profile

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

    # Firebase Token
    FirebaseToken.objects.get_or_create(user=resident_user, defaults={'token': 'fake_token_123'})

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

    # === Cư dân: Ngọc ===
    user_ngoc, created = User.objects.get_or_create(
        email='ngoc@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_ngoc.set_password('ngoc123')
        user_ngoc.save()
    if not hasattr(user_ngoc, 'resident_profile'):
        ngoc_profile = Resident.objects.create(user=user_ngoc, id_number='987654321', relationship_status='Chủ hộ')
    else:
        ngoc_profile = user_ngoc.resident_profile

    apt_ngoc, _ = Apartment.objects.get_or_create(
        code='A101',
        defaults={'building': 'A', 'floor': 1, 'number': '01', 'owner': user_ngoc}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_ngoc,
        category=mgmt_fee,
        transaction_id='TXN002',
        defaults={
            'amount': 300000,
            'method': 'VNPAY',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 1000
        }
    )

    locker_ngoc, _ = ParcelLocker.objects.get_or_create(resident=ngoc_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_ngoc,
        name='Bưu phẩm từ Lazada',
        defaults={'status': 'PENDING', 'note': 'Đang ở tủ đồ tầng trệt'}
    )

    Feedback.objects.get_or_create(
        resident=ngoc_profile,
        title='Thang máy chậm',
        defaults={'content': 'Thang máy hoạt động chậm, mong BQT kiểm tra.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=ngoc_profile
    )

    # === Cư dân: Minh ===
    user_minh, created = User.objects.get_or_create(
        email='minh@example.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_minh.set_password('minh123')
        user_minh.save()
    if not hasattr(user_minh, 'resident_profile'):
        minh_profile = Resident.objects.create(user=user_minh, id_number='564738291', relationship_status='Chủ hộ')
    else:
        minh_profile = user_minh.resident_profile

    apt_minh, _ = Apartment.objects.get_or_create(
        code='C303',
        defaults={'building': 'C', 'floor': 3, 'number': '03', 'owner': user_minh}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_minh,
        category=mgmt_fee,
        transaction_id='TXN003',
        defaults={
            'amount': 300000,
            'method': 'MOMO',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 2000
        }
    )

    locker_minh, _ = ParcelLocker.objects.get_or_create(resident=minh_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_minh,
        name='Giao hàng nhanh',
        defaults={'status': 'RECEIVED', 'note': 'Đã nhận'}
    )

    Feedback.objects.get_or_create(
        resident=minh_profile,
        title='Nước rỉ ở hành lang',
        defaults={'content': 'Có nước rỉ từ trần ở hành lang tầng 3.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option1,
        resident=minh_profile
    )

    # === Cư dân: Nhân ===
    user_nhan, created = User.objects.get_or_create(
        email='nhan@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_nhan.set_password('nhan123')
        user_nhan.save()

    if not hasattr(user_nhan, 'resident_profile'):
        nhan_profile = Resident.objects.create(user=user_nhan, id_number='987654331', relationship_status='Chủ hộ')
    else:
        nhan_profile = user_nhan.resident_profile

    apt_nhan, _ = Apartment.objects.get_or_create(
        code='B302',
        defaults={'building': 'B', 'floor': 3, 'number': '02', 'owner': user_nhan}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_nhan,
        category=mgmt_fee,
        transaction_id='TXN004',
        defaults={
            'amount': 300000,
            'method': 'VNPAY',
            'status': 'PENDING',
            'paid_date': datetime.now(),
            'transaction_fee': 1000
        }
    )

    locker_nhan, _ = ParcelLocker.objects.get_or_create(resident=nhan_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_nhan,
        name='Bưu phẩm từ CellphoneS: Màn hình máy tính ViewSonic 27inch 2K 100Hz',
        defaults={'status': 'PENDING', 'note': 'Đang ở tủ đồ tầng trệt'}
    )

    Feedback.objects.get_or_create(
        resident=nhan_profile,
        title='Hay cúp nước',
        defaults={'content': 'Hệ thống không hoạt động, mong BQT kiểm tra.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=nhan_profile
    )

    # === Cư dân: Phúc ===
    user_phuc, created = User.objects.get_or_create(
        email='phuc@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_phuc.set_password('phuc123')
        user_phuc.save()

    if not hasattr(user_phuc, 'resident_profile'):
        phuc_profile = Resident.objects.create(user=user_phuc, id_number='123456789', relationship_status='Chủ hộ')
    else:
        phuc_profile = user_phuc.resident_profile

    apt_phuc, _ = Apartment.objects.get_or_create(
        code='A204',
        defaults={'building': 'A', 'floor': 2, 'number': '04', 'owner': user_phuc}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_phuc,
        category=mgmt_fee,
        transaction_id='TXN005',
        defaults={
            'amount': 250000,
            'method': 'MOMO',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 1500
        }
    )

    locker_phuc, _ = ParcelLocker.objects.get_or_create(resident=phuc_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_phuc,
        name='Túi giao từ Shopee: Đồ điện gia dụng',
        defaults={'status': 'PENDING', 'note': 'Đang ở tủ đồ tầng 2'}
    )

    Feedback.objects.get_or_create(
        resident=phuc_profile,
        title='Quạt hành lang tầng 2 bị hư',
        defaults={'content': 'Quạt không quay, gây nóng và bí bách khu vực hành lang.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=phuc_profile
    )

    # === Cư dân: Nam ===
    user_nam, created = User.objects.get_or_create(
        email='nam@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_nam.set_password('nam123')
        user_nam.save()

    if not hasattr(user_nam, 'resident_profile'):
        nam_profile = Resident.objects.create(user=user_nam, id_number='567891234', relationship_status='Chủ hộ')
    else:
        nam_profile = user_nam.resident_profile

    apt_nam, _ = Apartment.objects.get_or_create(
        code='C105',
        defaults={'building': 'C', 'floor': 1, 'number': '05', 'owner': user_nam}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_nam,
        category=mgmt_fee,
        transaction_id='TXN005',
        defaults={
            'amount': 280000,
            'method': 'MOMO',
            'status': 'PENDING',
            'paid_date': datetime.now(),
            'transaction_fee': 1200
        }
    )

    locker_nam, _ = ParcelLocker.objects.get_or_create(resident=nam_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_nam,
        name='Thùng hàng Tiki: Nồi chiên không dầu',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ cạnh thang máy tầng 1'}
    )

    Feedback.objects.get_or_create(
        resident=nam_profile,
        title='Wifi khu vực tầng 1 yếu',
        defaults={'content': 'Đề nghị lắp thêm router để cải thiện sóng wifi.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=nam_profile
    )

    # === Cư dân: Hậu ===
    user_hau, created = User.objects.get_or_create(
        email='hau@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_hau.set_password('hau123')
        user_hau.save()

    if not hasattr(user_hau, 'resident_profile'):
        hau_profile = Resident.objects.create(user=user_hau, id_number='876543219', relationship_status='Chủ hộ')
    else:
        hau_profile = user_hau.resident_profile

    apt_hau, _ = Apartment.objects.get_or_create(
        code='D406',
        defaults={'building': 'D', 'floor': 4, 'number': '06', 'owner': user_hau}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_hau,
        category=mgmt_fee,
        transaction_id='TXN006',
        defaults={
            'amount': 320000,
            'method': 'VNPAY',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 1000
        }
    )

    locker_hau, _ = ParcelLocker.objects.get_or_create(resident=hau_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_hau,
        name='Kiện hàng Lazada: Máy hút bụi Xiaomi',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ góc phải tầng 4'}
    )

    Feedback.objects.get_or_create(
        resident=hau_profile,
        title='Hành lang có mùi lạ',
        defaults={'content': 'Mùi lạ xuất hiện buổi tối, mong được kiểm tra xử lý.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=hau_profile
    )

    # === Cư dân: Như ===
    user_nhu, created = User.objects.get_or_create(
        email='nhu@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_nhu.set_password('nhu123')
        user_nhu.save()

    if not hasattr(user_nhu, 'resident_profile'):
        nhu_profile = Resident.objects.create(user=user_nhu, id_number='192837465', relationship_status='Chủ hộ')
    else:
        nhu_profile = user_nhu.resident_profile

    apt_nhu, _ = Apartment.objects.get_or_create(
        code='C105',
        defaults={'building': 'C', 'floor': 1, 'number': '05', 'owner': user_nhu}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_nhu,
        category=mgmt_fee,
        transaction_id='TXN007',
        defaults={
            'amount': 280000,
            'method': 'MOMO',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 1200
        }
    )

    locker_nhu, _ = ParcelLocker.objects.get_or_create(resident=nhu_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_nhu,
        name='Hộp mỹ phẩm từ Tiki Trading',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ gần thang máy tầng 1'}
    )

    Feedback.objects.get_or_create(
        resident=nhu_profile,
        title='Cần thêm chỗ đậu xe máy',
        defaults={'content': 'Khu A buổi tối không đủ chỗ đậu xe, cần xem xét mở rộng.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=nhu_profile
    )

    # === Cư dân: Duyên ===
    user_duyen, created = User.objects.get_or_create(
        email='duyen@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_duyen.set_password('duyen123')
        user_duyen.save()

    if not hasattr(user_duyen, 'resident_profile'):
        duyen_profile = Resident.objects.create(user=user_duyen, id_number='246813579', relationship_status='Chủ hộ')
    else:
        duyen_profile = user_duyen.resident_profile

    apt_duyen, _ = Apartment.objects.get_or_create(
        code='D406',
        defaults={'building': 'D', 'floor': 4, 'number': '06', 'owner': user_duyen}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_duyen,
        category=mgmt_fee,
        transaction_id='TXN008',
        defaults={
            'amount': 290000,
            'method': 'VNPAY',
            'status': 'PENDING',
            'paid_date': datetime.now(),
            'transaction_fee': 1300
        }
    )

    locker_duyen, _ = ParcelLocker.objects.get_or_create(resident=duyen_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_duyen,
        name='Hàng giao từ Lazada: Máy xay sinh tố',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ gần sảnh Block D'}
    )

    Feedback.objects.get_or_create(
        resident=duyen_profile,
        title='Đèn cầu thang không sáng',
        defaults={'content': 'Đèn hành lang tầng 4 bị hỏng, cần sửa gấp để đảm bảo an toàn.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=duyen_profile
    )

    # === Cư dân: Xuân ===
    user_xuan, created = User.objects.get_or_create(
        email='xuan@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_xuan.set_password('xuan123')
        user_xuan.save()

    if not hasattr(user_xuan, 'resident_profile'):
        xuan_profile = Resident.objects.create(user=user_xuan, id_number='112233445', relationship_status='Chủ hộ')
    else:
        xuan_profile = user_xuan.resident_profile

    apt_xuan, _ = Apartment.objects.get_or_create(
        code='A105',
        defaults={'building': 'A', 'floor': 1, 'number': '05', 'owner': user_xuan}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_xuan,
        category=mgmt_fee,
        transaction_id='TXN009',
        defaults={
            'amount': 270000,
            'method': 'MOMO',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 1200
        }
    )

    locker_xuan, _ = ParcelLocker.objects.get_or_create(resident=xuan_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_xuan,
        name='Giao từ Tiki: Bộ sách giáo dục trẻ em',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ tầng trệt Block E'}
    )

    Feedback.objects.get_or_create(
        resident=xuan_profile,
        title='Thang máy bị chậm',
        defaults={'content': 'Thang máy tầng 1 hoạt động chậm, gây ùn tắc giờ cao điểm.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=xuan_profile
    )

    # === Cư dân: Huy ===
    user_huy, created = User.objects.get_or_create(
        email='huy@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_huy.set_password('huy123')
        user_huy.save()

    if not hasattr(user_huy, 'resident_profile'):
        huy_profile = Resident.objects.create(user=user_huy, id_number='998877665', relationship_status='Chủ hộ')
    else:
        huy_profile = user_huy.resident_profile

    apt_huy, _ = Apartment.objects.get_or_create(
        code='C208',
        defaults={'building': 'C', 'floor': 2, 'number': '08', 'owner': user_huy}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_huy,
        category=mgmt_fee,
        transaction_id='TXN010',
        defaults={
            'amount': 320000,
            'method': 'VNPAY',
            'status': 'PENDING',
            'paid_date': datetime.now(),
            'transaction_fee': 1300
        }
    )

    locker_huy, _ = ParcelLocker.objects.get_or_create(resident=huy_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_huy,
        name='Giao từ Lazada: Loa Bluetooth JBL',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ tầng 2 - Block F'}
    )

    Feedback.objects.get_or_create(
        resident=huy_profile,
        title='Cửa kính tầng trệt bị kẹt',
        defaults={'content': 'Cửa kính tự động không đóng lại, dễ gây mất an toàn.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=huy_profile
    )

    # === Cư dân: My ===
    user_my, created = User.objects.get_or_create(
        email='my@gmail.com',
        defaults={'role': 'RESIDENT'}
    )
    if created:
        user_my.set_password('my123')
        user_my.save()

    if not hasattr(user_my, 'resident_profile'):
        my_profile = Resident.objects.create(user=user_my, id_number='112233445', relationship_status='Chủ hộ')
    else:
        my_profile = user_my.resident_profile

    apt_my, _ = Apartment.objects.get_or_create(
        code='C305',
        defaults={'building': 'C', 'floor': 3, 'number': '05', 'owner': user_my}
    )

    PaymentTransaction.objects.get_or_create(
        apartment=apt_my,
        category=mgmt_fee,
        transaction_id='TXN011',
        defaults={
            'amount': 280000,
            'method': 'MOMO',
            'status': 'COMPLETED',
            'paid_date': datetime.now(),
            'transaction_fee': 1200
        }
    )

    locker_my, _ = ParcelLocker.objects.get_or_create(resident=my_profile)
    ParcelItem.objects.get_or_create(
        locker=locker_my,
        name='Giao từ Tiki: Máy sấy tóc',
        defaults={'status': 'PENDING', 'note': 'Tủ đồ tầng 3 - Block C'}
    )

    Feedback.objects.get_or_create(
        resident=my_profile,
        title='Sân chơi trẻ em bị hư hỏng',
        defaults={'content': 'Cần sửa lại sân chơi cho trẻ em, hiện tại bị gãy thanh chắn.', 'status': 'NEW'}
    )

    SurveyResponse.objects.get_or_create(
        survey=survey,
        option=option2,
        resident=my_profile
    )

    # === Nhân viên: Bảo ===
    user_bao, created = User.objects.get_or_create(
        email='bao@gmail.com',
        defaults={'role': 'STAFF'}
    )
    if created:
        user_bao.set_password('bao123')
        user_bao.save()

    if not hasattr(user_bao, 'resident_profile'):
        bao_profile = Resident.objects.create(user=user_bao, id_number='998877665', relationship_status='Nhân viên')
    else:
        bao_profile = user_bao.resident_profile

    # === Nhân viên: Lâm ===
    user_lam, created = User.objects.get_or_create(
        email='lam@gmail.com',
        defaults={'role': 'STAFF'}
    )
    if created:
        user_lam.set_password('lam123')
        user_lam.save()

    if not hasattr(user_lam, 'resident_profile'):
        lam_profile = Resident.objects.create(user=user_lam, id_number='554433221', relationship_status='Nhân viên')
    else:
        lam_profile = user_lam.resident_profile

    print("✅ Đã seed đầy đủ dữ liệu mẫu thành công!")

if __name__ == '__main__':
    seed()