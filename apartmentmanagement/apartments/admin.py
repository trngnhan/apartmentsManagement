from django.contrib import admin
from django.urls import path

from apartments.models import (User, Resident, Apartment, ApartmentTransferHistory,\
    PaymentCategory, PaymentTransaction, ParcelLocker, ParcelItem,Feedback,
                               Survey, SurveyOption, SurveyResponse, VisitorVehicleRegistration)

class MyAdminSite(admin.AdminSite):
    site_header = 'APARTMENT MANAGEMENT'

admin_site = MyAdminSite('Apartment Management')
admin_site.register(User)
admin_site.register(Resident)
admin_site.register(Apartment)
admin_site.register(ApartmentTransferHistory)
admin_site.register(PaymentCategory)
admin_site.register(PaymentTransaction)
admin_site.register(ParcelLocker)
admin_site.register(ParcelItem)
admin_site.register(Feedback)
admin_site.register(Survey)
admin_site.register(SurveyOption)
admin_site.register(SurveyResponse)
admin_site.register(VisitorVehicleRegistration)
