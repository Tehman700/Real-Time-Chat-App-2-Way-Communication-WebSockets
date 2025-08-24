from rest_framework import serializers
from api.models.chatting_models import GroupMessage, ChatGroup
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions


class GroupMessageSerializer(serializers.ModelSerializer):
    author = serializers.ReadOnlyField(source="author.username")

    class Meta:
        model = GroupMessage
        fields = ["id", "group", "author", "body", "created"]
        read_only_fields = ["id", "author", "created"]


class SaveMessageAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        group_name = request.data.get("group_name")
        body = request.data.get("body")

        if not group_name or not body:
            return Response({
                "code": -1,
                "error": "group_name and body are required"},
                status=200)

        try:
            group = ChatGroup.objects.get(group_name=group_name)
        except ChatGroup.DoesNotExist:
            return Response({"code": -2, "error": "Group not found"}, status=200)

        message = GroupMessage.objects.create(
            group=group,
            author=request.user,
            body=body
        )

        serializer = GroupMessageSerializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        group_name = request.GET.get("group_name")

        if not group_name:
            return Response({
                "code": -1,
                "error": "group_name parameter is required"
            }, status=200)

        try:
            group = ChatGroup.objects.get(group_name=group_name)
            # Filter messages by group and order by creation time
            messages = GroupMessage.objects.filter(group=group).order_by('created')
            serializer = GroupMessageSerializer(messages, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ChatGroup.DoesNotExist:
            return Response({
                "code": -2,
                "error": "Group not found"
            }, status=200)