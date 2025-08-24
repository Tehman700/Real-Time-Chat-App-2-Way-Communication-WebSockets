from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from urllib.parse import parse_qs
import json


User = get_user_model()

connected_users = {}


class OneToOneChattingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope["query_string"].decode()
        params = parse_qs(query_string)
        token = params.get("token", [None])[0]
        self.chat_with = params.get("to", [None])[0]

        if not token or not self.chat_with:
            await self.close()
            return

        try:
            access_token = AccessToken(token)
            user = await database_sync_to_async(User.objects.get)(id=access_token["user_id"])
            self.username = user.username
        except Exception:
            await self.close()
            return

        await self.accept()
        connected_users[self.username] = self

    async def disconnect(self, close_code):
        connected_users.pop(self.username, None)

    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        message = data.get("message")
        if not message:
            return

        # Send to the recipient if online
        recipient_consumer = connected_users.get(self.chat_with)
        if recipient_consumer:
            await recipient_consumer.send(text_data=json.dumps({
                "sender": self.username,
                "message": message
            }))

