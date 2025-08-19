from asgiref.sync import async_to_sync
from channels.exceptions import StopConsumer
from channels.generic.websocket import AsyncJsonWebsocketConsumer,AsyncConsumer

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






class ChattingConsumer(AsyncConsumer):
    async def websocket_connect(self,event):
        print("websocket connected....",event)

        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = f"{self.room_name}"

        print(f"Joined Room: {self.room_group_name}")


        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # Accept WebSocket
        await self.send({"type": "websocket.accept"})


    async def websocket_receive(self, event):
        msg_from_client = event.get("text")
        print("Message from client:", msg_from_client)

        # Send to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat.message",
                "message": msg_from_client,
                "sender_channel_name": self.channel_name

            }
        )


    async def chat_message(self, event):
        if event.get("sender_channel_name") == self.channel_name:
            return


        await self.send({
            "type": "websocket.send",
            "text": event['message']
        })

    async def websocket_disconnect(self, event):
        print("❌ WebSocket disconnected")

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        raise StopConsumer()
