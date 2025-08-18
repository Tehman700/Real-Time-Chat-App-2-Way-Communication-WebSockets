# api/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from api.models.authentication_models import FriendRequest, User

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_friend_request(request, user_id):
    sender = request.user
    try:
        receiver = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    # Save request in DB
    friend_request, created = FriendRequest.objects.get_or_create(sender=sender, receiver=receiver)

    if not created:
        return Response({"error": "Friend request already sent"}, status=400)

    # Notify receiver via WebSocket
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{receiver.id}",
        {
            "type": "notify",
            "data": {
                "type": "friend_request",
                "request_id": friend_request.id,
                "from": sender.username,
                "message": f"{sender.username} sent you a friend request!"
            }
        }
    )

    return Response({"status": "request_sent"})


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def respond_friend_request(request, request_id):
    action = request.data.get("action")  # "accept" or "reject"
    try:
        fr = FriendRequest.objects.get(id=request_id, receiver=request.user)
    except FriendRequest.DoesNotExist:
        return Response({"error": "Friend request not found"}, status=404)

    if action == "accept":
        fr.status = "accepted"
        message = f"{request.user.username} accepted your friend request!"
    else:
        fr.status = "rejected"
        message = f"{request.user.username} rejected your friend request!"

    fr.save()

    # Notify sender (User A)
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"user_{fr.sender.id}",
        {
            "type": "notify",
            "data": {
                "type": "friend_response",
                "from": request.user.username,
                "status": fr.status,
                "message": message
            }
        }
    )

    return Response({"status": "updated", "new_status": fr.status})
