import json
from channels.generic.websocket import AsyncWebsocketConsumer

online_users = set()

class OnlineUsersConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if not self.user.is_authenticated:
            await self.close()
            return

        online_users.add(self.user.username)
        await self.channel_layer.group_add("online_users", self.channel_name)
        await self.accept()
        # FIX: broadcast to everyone (not just self)
        await self.broadcast_online_users()

    async def disconnect(self, close_code):
        online_users.discard(self.user.username)
        await self.channel_layer.group_discard("online_users", self.channel_name)
        await self.broadcast_online_users()

    async def broadcast_online_users(self):
        from channels.layers import get_channel_layer
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            "online_users",
            {
                "type": "online_users_update",
                "users": list(online_users)
            }
        )

    async def online_users_update(self, event):
        # Exclude self before sending
        users = [u for u in event["users"] if u != self.user.username]
        await self.send(text_data=json.dumps({"online_users": users}))
