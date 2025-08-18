from channels.generic.websocket import AsyncJsonWebsocketConsumer

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # Reject unauthenticated users
        if not self.scope["user"].is_authenticated:
            await self.close()
            return

        self.user = self.scope["user"]
        self.group_name = f"user_{self.user.id}"

        # Add this user's channel to their personal group
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
        """
        This will be triggered when another part of your app
        calls group_send() with type="notify".
        Example payload:
            {
                "type": "notify",
                "data": {"message": "You have a new friend request"}
            }
        """
        await self.send_json(event["data"])
