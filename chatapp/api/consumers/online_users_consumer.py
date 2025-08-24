import json
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

# Global dictionary to track online users and their channels
USERS_ONLINE = {}
User = get_user_model()


class OnlineUsersConsumer(WebsocketConsumer):
    def connect(self):
        query_string = self.scope["query_string"].decode()
        if "token=" not in query_string:
            self.close()
            return

        token = query_string.split("token=")[-1]

        try:
            access_token = AccessToken(token)
            user = User.objects.get(id=access_token["user_id"])

            self.username = user.username
            self.channel_name = self.channel_name

            # Add user to the online users tracking
            if self.username not in USERS_ONLINE:
                USERS_ONLINE[self.username] = []

            # For multiple tabs and pages we will use channels
            if self.channel_name not in USERS_ONLINE[self.username]:
                USERS_ONLINE[self.username].append(self.channel_name)

            async_to_sync(self.channel_layer.group_add)(
                "online_users",
                self.channel_name
            )

            print(f"User {self.username} connected. Online users: {list(USERS_ONLINE.keys())}")

        except Exception as e:
            print(f"Connection error: {str(e)}")
            self.close()
            return

        self.accept()

        # Broadcast updated online users list to all connected clients
        self.broadcast_online_users()

    def disconnect(self, close_code):
        print(f"User {getattr(self, 'username', 'unknown')} disconnecting...")

        if hasattr(self, 'username') and self.username in USERS_ONLINE:
            # Remove this specific channel from user's channel list
            if self.channel_name in USERS_ONLINE[self.username]:
                USERS_ONLINE[self.username].remove(self.channel_name)

            # If user has no more active channels, remove them from online users
            if not USERS_ONLINE[self.username]:
                del USERS_ONLINE[self.username]

            # Leave the online-users group
            async_to_sync(self.channel_layer.group_discard)(
                "online_users",
                self.channel_name
            )

            print(f"User {self.username} disconnected. Online users: {list(USERS_ONLINE.keys())}")

            # Broadcast updated online users list to all remaining connected clients
            self.broadcast_online_users()

    def receive(self, text_data):
        """Handle messages from client"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type', 'message')

            if message_type == 'heartbeat':
                # Respond to heartbeat to keep connection alive
                self.send(text_data=json.dumps({
                    'type': 'heartbeat_response',
                    'status': 'alive'
                }))
            else:
                print(f"Received from {self.username}: {text_data}")

        except json.JSONDecodeError:
            print(f"Received non-JSON data from {getattr(self, 'username', 'unknown')}: {text_data}")

    def broadcast_online_users(self):
        """Broadcast the current online users list to all connected clients"""
        online_usernames = list(USERS_ONLINE.keys())

        # Send to all clients in the online_users group
        async_to_sync(self.channel_layer.group_send)(
            "online_users",
            {
                "type": "online_users_update",
                "users": online_usernames
            }
        )

    def online_users_update(self, event):
        """Handle broadcasting online users update to this specific client"""
        users = event["users"]

        self.send(text_data=json.dumps({
            'type': 'online_users_update',
            'status': 'connected to server',
            'data': users,
            'count': len(users),
            'timestamp': json.dumps(None, default=str)  # You can add actual timestamp if needed
        }))

    # Additional method to handle custom events if needed
    def send_notification(self, event):
        """Handle sending notifications to specific users"""
        notification = event["notification"]

        self.send(text_data=json.dumps({
            'type': 'notification',
            'data': notification
        }))