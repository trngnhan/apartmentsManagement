from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from apartments.models import Resident
from django.contrib.auth.models import User

class ItemSerializer(ModelSerializer):
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['image'] = instance.image.url if instance.image else ''
        return data

# class UserSerializer(ModelSerializer):
#     def to_representation(self, instance):
#         data = super().to_representation(instance)
#         data['image'] = instance.image.url if instance.image else ''
#         return data
#
#     def create(self, validated_data):
#         password = validated_data.pop('password', None)
#         user = User(**validated_data)
#         if password:
#             user.set_password(password)
#         user.save()
#         return user
#
#     class Meta:
#         model = User
#         fields = ['id', 'username', 'password', 'phone', 'avatar']
#         extra_kwargs = \
#             {'password':
#                 {
#                     'write_only': True
#                 }
#             }

class ResidentSerializer(ItemSerializer):
    class Meta:
        model = Resident
        fields = ['id', 'user', 'apartment_number']