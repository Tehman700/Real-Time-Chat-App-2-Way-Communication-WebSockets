from django.urls import re_path, path
from api.consumers.chatting_consumers import ChattingConsumer
from api.consumers.notification_consumers import NotificationConsumer,PresenceConsumer
from api.consumers.one_to_one_chat_consumer import OneToOneChatConsumer
from api.consumers.onetoonechattingconsumer import OneToOneChattingConsumer
from api.consumers.online_users_consumer import OnlineUsersConsumer

websocket_urlpatterns = [
    re_path(r"ws/notifications/$", NotificationConsumer.as_asgi()),
    path("ws/presence/", PresenceConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<room_name>\w+)/$', ChattingConsumer.as_asgi()),
    re_path(r'ws/online-status/$', OneToOneChatConsumer.as_asgi()),
    re_path(r'ws/onetoonechatting/$', OneToOneChattingConsumer.as_asgi()),
    re_path(r'ws/online-users/$', OnlineUsersConsumer.as_asgi()),

]
