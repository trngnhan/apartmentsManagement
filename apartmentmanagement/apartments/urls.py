from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

from .views import (resident_login_view, resident_home_view, UserViewSet, ResidentViewSet,
                    ApartmentViewSet, ApartmentTransferHistoryViewSet, PaymentTransactionViewSet, PaymentCategoryViewSet,
                    FirebaseTokenViewSet, ParcelLockerViewSet, FeedbackViewSet, SurveyViewSet, SurveyOptionViewSet,
                    SurveyResponseViewSet, VisitorVehicleRegistrationViewSet)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'residents', ResidentViewSet, basename='resident')
router.register(r'apartments', ApartmentViewSet, basename='apartment')
router.register(r'apartmentstranshistories', ApartmentTransferHistoryViewSet, basename='apartmentstranshistory')
router.register(r'paymentcategories', PaymentCategoryViewSet, basename='payment')
router.register(r'paymenttransactions', PaymentTransactionViewSet, basename='paymenttransaction')
router.register(r'paymentcategories', PaymentCategoryViewSet, basename='paymentcategory')
router.register(r'firebasetokens', FirebaseTokenViewSet, basename='firebasetoken')
router.register(r'parcellockers', ParcelLockerViewSet, basename='parcellocker')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')
router.register(r'surveys', SurveyViewSet, basename='survey')
router.register(r'surveyoptions', SurveyOptionViewSet, basename='surveyoption')
router.register(r'surveyresponses', SurveyResponseViewSet, basename='surveyresponse')
router.register(r'visitorvehicleregistrations', VisitorVehicleRegistrationViewSet, basename='visitorvehicleregistration')
urlpatterns = [
    path('', include(router.urls)),


    path('login/', resident_login_view, name='resident_login'),
    path('change-password/', views.change_password, name='change_password'),
    path('upload-avatar/', views.upload_avatar, name='upload_avatar'),
    path('home/', resident_home_view, name='resident_home'),
    path('send-sms/', ParcelLockerViewSet.as_view({'post': 'send_sms'}), name='send-sms'),
]