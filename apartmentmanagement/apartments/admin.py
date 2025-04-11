from django.contrib import admin
from django.urls import path

from apartments.models import User


class MyAdminSite(admin.AdminSite):
    site_header = 'APARTMENT MANAGEMENT'

admin_site = MyAdminSite('Apartment Management')
admin_site.register(User)