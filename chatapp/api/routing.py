from django.urls import re_path, path
from api.consumers.chatting_consumers import ChattingConsumer
from api.consumers.notification_consumers import NotificationConsumer,PresenceConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
    path("ws/presence/", PresenceConsumer.as_asgi()),

    re_path(r'ws/chat/(?P<room_name>\w+)/$', ChattingConsumer.as_asgi()),
]
