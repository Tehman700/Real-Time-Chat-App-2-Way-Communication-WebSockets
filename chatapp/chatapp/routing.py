from django.urls import re_path
from api import consumers   # import from your single app

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", consumers.NotificationConsumer.as_asgi()),
]
