from apartments import serializers
from rest_framework import viewsets, generics, status, parsers
from apartments.models import Resident, Payment, Invoice

class ResidentViewSet(viewsets.ViewSet, generics.ListAPIView):
    queryset = Resident.objects.filter(active=True)
    serializer_class = serializers.ResidentSerializer