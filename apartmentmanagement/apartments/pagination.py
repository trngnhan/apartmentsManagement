from rest_framework.pagination import PageNumberPagination
from twilio.rest import Client

class Pagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'