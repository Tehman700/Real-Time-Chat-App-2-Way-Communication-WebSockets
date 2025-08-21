import json
from datetime import datetime
from django.core.cache import cache
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class OneToOneChatConsumer(AsyncWebsocketConsumer):
    online_users = set()
    user_connections = {}

    async def connect(self):
        token = self.scope["query_string"].decode().split("token=")[-1]

        try:
            access_token = AccessToken(token)
            user = await database_sync_to_async(User.objects.get)(id = access_token["user_id"])
            self.username = user.username

        except Exception as e:
            await self.close()
            return

        await self.accept()

        OneToOneChatConsumer.online_users.add(self.username)
        OneToOneChatConsumer.user_connections[self.username] = self.channel_name

        cache.set(f"online_status_{self.username}", 'online', timeout=None)

        # Send current online status of all users to this user
        await self.send_bulk_status()

        # Broadcast this user's online status to all connected users
        await self.broadcast_status_update(self.username, 'online')


    async def disconnect(self, close_code):
        if hasattr(self, 'username'):

            # Remove user from online users
            OneToOneChatConsumer.online_users.discard(self.username)
            OneToOneChatConsumer.user_connections.pop(self.username, None)

            cache.set(f"online_status_{self.username}", 'offline', timeout=None)

            # Broadcast offline status to all connected users
            await self.broadcast_status_update(self.username, 'offline')



    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get("type")
        username = data.get("username")

        if message_type == "user_online":
            OneToOneChatConsumer.online_users.add(username)
            OneToOneChatConsumer.user_connections[username] = self.channel_name
            cache.set(f"online_status_{username}", 'online', timeout=None)
            await self.broadcast_status_update(username, 'online')

        elif message_type == "user_offline":
            OneToOneChatConsumer.online_users.discard(username)
            OneToOneChatConsumer.user_connections.pop(username, None)
            cache.set(f"online_status_{username}", 'offline', timeout=None)
            await self.broadcast_status_update(username, 'offline')

    async def broadcast_status_update(self, username, status):
        message = {
            'type': 'status_update',
            'username': username,
            'status': status,
            'timestamp': datetime.now().isoformat()
        }

        for channel_name in OneToOneChatConsumer.user_connections.values():
            await self.channel_layer.send(channel_name, {
                'type': 'status_broadcast',
                'message': message
            })


    async def status_broadcast(self, event):
        await self.send(text_data=json.dumps(event["message"]))

    async def send_bulk_status(self):
        statuses = {
            user: cache.get(f"online_status_{user}", "offline")
            for user in OneToOneChatConsumer.online_users
        }
        await self.send(
            text_data=json.dumps(
                {
                    "type": "bulk_status",
                    "users": statuses,
                }
            )
        )