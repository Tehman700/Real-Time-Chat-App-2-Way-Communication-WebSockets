import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # All users join the same group "chatroom"
        self.room_group_name = "chatroom"
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        user = data["user"]
        message = data["message"]

        # Send the message to everyone in the group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "user": user,
                "message": message
            }
        )

    async def chat_message(self, event):
        # Send the message to WebSocket client
        await self.send(text_data=json.dumps({
            "user": event["user"],
            "message": event["message"]
        }))
