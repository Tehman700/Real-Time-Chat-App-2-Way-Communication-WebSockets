import json
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken


ROOM_USERS = {} # IT'S A DICT WHERE ALL USERNAMES WILL BE STORED FOR ROOM
User = get_user_model()


class ChattingConsumer(AsyncConsumer):
    async def websocket_connect(self, event):

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"{self.room_name}"

        # JWT Authentication from query string
        token = self.scope["query_string"].decode().split("token=")[-1]
        try:
            access_token = AccessToken(token)
            user = await database_sync_to_async(User.objects.get)(id=access_token["user_id"])
            # keeping this in mind that user is fetched from access_token mechanism

            self.username = user.username
        except Exception as e:
            await self.send({"type": "websocket.close"})
            return

        # Add user to room's set
        ROOM_USERS.setdefault(self.room_group_name, set()).add(self.username)

        # Join channel layer group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept WebSocket
        await self.send({"type": "websocket.accept"})

        # This is why we see Realtime updated user list
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "room.user_list",
                "users": list(ROOM_USERS[self.room_group_name])
            }
        )

    async def websocket_receive(self, event):
        # This is triggered when message ws.onsend is triggered or button of send message is clicked
        data = json.loads(event.get("text"))
        message_text = data.get("message", "")

        # Broadcast to group with sender username
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": message_text,
                "sender": self.username
            }
        )

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send({
            "type": "websocket.send",
            "text": json.dumps({
                "type": "chat",
                "message": event["message"],
                "sender": event["sender"]
            })
        })

    async def room_user_list(self, event):
        # Send updated room users list to WebSocket
        await self.send({
            "type": "websocket.send",
            "text": json.dumps({
                "type": "users",
                "users": event["users"]
            })
        })

    async def websocket_disconnect(self, event):
        # Remove user from room
        if hasattr(self, "username") and self.room_group_name in ROOM_USERS:
            ROOM_USERS[self.room_group_name].discard(self.username)
            # Broadcast updated user list
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    "type": "room.user_list",
                    "users": list(ROOM_USERS[self.room_group_name])
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        raise StopConsumer()
