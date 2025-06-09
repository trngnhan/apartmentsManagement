from rest_framework import serializers, generics
from django.contrib.auth import get_user_model
from .models import (Resident, Apartment,ApartmentTransferHistory, PaymentCategory, PaymentTransaction,
                     ParcelLocker, ParcelItem, Feedback, Survey, SurveyOption, SurveyResponse,
                     VisitorVehicleRegistration)

User = get_user_model()

# User Serializer
class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True, use_url=True)
    resident_id = serializers.SerializerMethodField()
    locker_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'profile_picture', 'role',
                  'must_change_password', 'resident_id', 'phone_number', 'is_superuser', 'is_staff', 'active',
                  'locker_id']
        read_only_fields = ['date_joined']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def get_resident_id(self, obj):
        try:
            return obj.resident_profile.id
        except AttributeError:
            return None

    def get_locker_id(self, obj):
        resident = getattr(obj, 'resident_profile', None)
        if resident:
            from apartments.models import ParcelLocker
            locker = ParcelLocker.objects.filter(resident=resident).first()
            return locker.id if locker else None
        return None

# Resident Serializer
class ResidentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    image = serializers.ImageField(source='user.profile_picture', read_only=True)

    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='user',
        write_only=True
    )

    class Meta:
        model = Resident
        fields = ['id', 'user', 'user_id', 'image']
        read_only_fields = ['created_date', 'updated_date']


# Apartment Serializer
class ApartmentSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(source='owner.user.email', read_only=True)
    first_name = serializers.CharField(source='owner.user.first_name', read_only=True)
    last_name = serializers.CharField(source='owner.user.last_name', read_only=True)

    class Meta:
        model = Apartment
        fields = ['id', 'code', 'building', 'floor', 'number', 'owner', 'owner_email', 'active', 'first_name', 'last_name']
        read_only_fields = ['created_date', 'updated_date']

# Apartment Transfer History Serializer
class ApartmentTransferHistorySerializer(serializers.ModelSerializer):
    previous_owner_email = serializers.EmailField(source='previous_owner.user.email', read_only=True)
    new_owner_email = serializers.EmailField(source='new_owner.user.email', read_only=True)
    apartment_code = serializers.CharField(source='apartment.code', read_only=True)

    class Meta:
        model = ApartmentTransferHistory
        fields = [
            'id', 'apartment', 'apartment_code', 'previous_owner', 'previous_owner_email',
            'new_owner', 'new_owner_email', 'transfer_date'
        ]
        read_only_fields = ['created_date', 'updated_date']


# Payment Category Serializer
class PaymentCategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = PaymentCategory
        fields = ['id', 'name', 'amount', 'is_recurring', 'description', 'active', 'frequency',
                  'tax_percentage', 'grace_period', 'category_type', 'created_date', 'total_amount']
        read_only_fields = ['created_date', 'updated_date']

    def validate_amount(self, value):
        #Kiểm tra giá trị amount phải là số dương.
        if value <= 0:
            raise serializers.ValidationError("Số tiền phải lớn hơn 0.")
        return value

    def validate_name(self, value):
        #Kiểm tra tên loại thanh toán không được trống.
        if not value:
            raise serializers.ValidationError("Tên loại thanh toán không được để trống.")
        return value

# Payment Transaction Serializer
class PaymentTransactionSerializer(serializers.ModelSerializer, generics.ListAPIView):
    apartment_code = serializers.CharField(source='apartment.code', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    payment_proof_url = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = ['id', 'apartment', 'apartment_code', 'category', 'category_name',
                  'amount', 'method', 'transaction_id', 'status', 'payment_proof',
                  'payment_proof_url', 'paid_date']
        read_only_fields = ['created_date', 'updated_date']

    def get_payment_proof_url(self, obj):
       # Trả về URL của payment_proof nếu có.
        if obj.payment_proof:
            return obj.payment_proof.url
        return None

    def validate_amount(self, value):
        #Kiểm tra số tiền phải lớn hơn 0.
        if value <= 0:
            raise serializers.ValidationError("Số tiền phải lớn hơn 0.")
        return value

    def validate_transaction_id(self, value):
        #Kiểm tra transaction_id không được trống.

        if not value:
            raise serializers.ValidationError("Transaction ID không được để trống.")
        return value

# Parcel Locker Serializer
class ParcelItemSerializer(serializers.ModelSerializer):
    resident_id = serializers.IntegerField(source='resident.id', read_only=True)
    resident_email = serializers.EmailField(source='resident.user.email', read_only=True)
    first_name = serializers.CharField(source='resident.user.first_name', read_only=True)
    last_name = serializers.CharField(source='resident.user.last_name', read_only=True)

    class Meta:
        model = ParcelItem
        fields = ['id', 'locker', 'name', 'status', 'note', 'resident_id', 'created_date', 'updated_date',
                  'first_name', 'last_name', 'resident_email']
        read_only_fields = ['created_date', 'updated_date']


class ParcelLockerSerializer(serializers.ModelSerializer):
    resident_email = serializers.EmailField(source='resident.user.email', read_only=True)
    first_name = serializers.CharField(source='resident.user.first_name', read_only=True)
    last_name = serializers.CharField(source='resident.user.last_name', read_only=True)
    resident_id = serializers.PrimaryKeyRelatedField(
        queryset=Resident.objects.all(),
        source='resident',
        write_only=True
    )

    class Meta:
        model = ParcelLocker
        fields = ['id', 'resident_id', 'resident_email', 'first_name', 'last_name', 'active', 'resident']
        read_only_fields = ['created_date', 'updated_date']
        extra_kwargs = {
            'resident': {'read_only': True}
        }

# Feedback Serializer
class FeedbackSerializer(serializers.ModelSerializer):
    resident_email = serializers.EmailField(source='resident.user.email', read_only=True)
    first_name = serializers.CharField(source='resident.user.first_name', read_only=True)
    last_name = serializers.CharField(source='resident.user.last_name', read_only=True)

    class Meta:
        model = Feedback
        fields = ['id', 'resident_email', 'title', 'content', 'status', 'created_date', 'updated_date', 'first_name', 'last_name']
        read_only_fields = ['created_date', 'updated_date']


# Survey Serializers
class SurveyOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SurveyOption
        fields = ['id', 'survey', 'option_text']
        read_only_fields = ['created_date', 'updated_date']


class SurveyResponseSerializer(serializers.ModelSerializer):
    resident_email = serializers.EmailField(source='resident.user.email', read_only=True)
    first_name = serializers.CharField(source='resident.user.first_name', read_only=True)
    last_name = serializers.CharField(source='resident.user.last_name', read_only=True)
    option_text = serializers.CharField(source='option.option_text', read_only=True)

    class Meta:
        model = SurveyResponse
        fields = ['id', 'survey', 'option', 'option_text', 'resident', 'resident_email', 'first_name', 'last_name']
        read_only_fields = ['created_date', 'updated_date', 'resident']


class SurveySerializer(serializers.ModelSerializer):
    options = SurveyOptionSerializer(many=True, read_only=True)

    class Meta:
        model = Survey
        fields = ['id', 'title', 'description', 'deadline', 'options', 'created_date', 'updated_date']
        read_only_fields = ['created_date', 'updated_date']

    def create(self, validated_data):
        options_data = self.context.get('options', [])
        survey = Survey.objects.create(**validated_data)

        for option_data in options_data:
            SurveyOption.objects.create(survey=survey, **option_data)

        return survey


# Visitor Vehicle Registration Serializer
class VisitorVehicleRegistrationSerializer(serializers.ModelSerializer):
    resident_email = serializers.EmailField(source='resident.user.email', read_only=True)
    first_name = serializers.CharField(source='resident.user.first_name', read_only=True)
    last_name = serializers.CharField(source='resident.user.last_name', read_only=True)

    class Meta:
        model = VisitorVehicleRegistration
        fields = ['id', 'resident_id', 'resident_email', 'visitor_name', 'vehicle_number',
                  'registration_date', 'approved', 'first_name', 'last_name']
        read_only_fields = ['registration_date', 'created_date', 'updated_date']