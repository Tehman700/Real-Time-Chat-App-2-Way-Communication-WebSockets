import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer,AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()

ONLINE_USERS = set()

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Reject unauthenticated users
        if not self.scope["user"].is_authenticated:
            await self.close()
            return

        self.user = self.scope["user"]
        self.group_name = f"user_{self.user.id}"

        # Users channel to the group adding here
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, code):
        # Only try to discard if group_name exists
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    async def notify(self, event):
        await self.send_json(event["data"])




class PresenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Get token from query string
        token = self.scope['query_string'].decode().split("token=")[-1]
        try:
            access_token = AccessToken(token)
            user = await database_sync_to_async(User.objects.get)(id=access_token['user_id'])
            self.scope["user"] = user
        except Exception:
            await self.close()
            return

        ONLINE_USERS.add(user.username)
        await self.channel_layer.group_add("online_users", self.channel_name)
        await self.accept()

        # Notify all users
        await self.channel_layer.group_send(
            "online_users",
            {
                "type": "user_list",
                "users": list(ONLINE_USERS),
            }
        )

    async def disconnect(self, code):
        user = self.scope.get("user")
        if user and user.username in ONLINE_USERS:
            ONLINE_USERS.remove(user.username)

        await self.channel_layer.group_discard("online_users", self.channel_name)

        # Notify others
        await self.channel_layer.group_send(
            "online_users",
            {
                "type": "user_list",
                "users": list(ONLINE_USERS),
            }
        )

    async def user_list(self, event):
        await self.send(text_data=json.dumps({
            "type": "users",
            "users": event["users"]
        }))