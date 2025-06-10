from django.urls import path, include
from . import views
from rest_framework.routers import DefaultRouter

from .views import (UserViewSet, ResidentViewSet,
                    ApartmentViewSet, ApartmentTransferHistoryViewSet, PaymentTransactionViewSet, PaymentCategoryViewSet,
                    ParcelLockerViewSet, FeedbackViewSet, SurveyViewSet, SurveyOptionViewSet,
                    SurveyResponseViewSet, VisitorVehicleRegistrationViewSet)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentCategoryViewSet, PaymentTransactionViewSet, momo_ipn

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'residents', ResidentViewSet, basename='resident')
router.register(r'apartments', ApartmentViewSet, basename='apartment')
router.register(r'apartmentstranshistories', ApartmentTransferHistoryViewSet, basename='apartmentstranshistory')
router.register(r'paymentcategories', PaymentCategoryViewSet, basename='payment')
router.register(r'paymenttransactions', PaymentTransactionViewSet, basename='paymenttransaction')
router.register(r'paymentcategories', PaymentCategoryViewSet, basename='paymentcategory')
router.register(r'parcellockers', ParcelLockerViewSet, basename='parcellocker')
router.register(r'feedbacks', FeedbackViewSet, basename='feedback')
router.register(r'surveys', SurveyViewSet, basename='survey')
router.register(r'surveyoptions', SurveyOptionViewSet, basename='surveyoption')
router.register(r'surveyresponses', SurveyResponseViewSet, basename='surveyresponse')
router.register(r'visitorvehicleregistrations', VisitorVehicleRegistrationViewSet, basename='visitorvehicleregistration')
urlpatterns = [
    path('', include(router.urls)),
    path('paymenttransactions/momo-ipn/', views.momo_ipn, name='momo_ipn'),
]