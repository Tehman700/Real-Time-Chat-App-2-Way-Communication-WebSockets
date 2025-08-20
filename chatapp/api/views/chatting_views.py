from django.http import JsonResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from api.models.chatting_models import ChatGroup


class ChatGroupAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        groups = ChatGroup.objects.all().values_list("group_name", flat=True)
        ty = list(groups)
        if len(ty) == 0:
            return JsonResponse({
                "status": 1,
                "message": "No groups found",
                "data": []
            },status=status.HTTP_200_OK)

        return JsonResponse(
            {"status": 0,"groups": ty},status=status.HTTP_200_OK)


class CreateChatGroupAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        group_name = request.data.get("group_name")
        chat_group = ChatGroup.objects.create(group_name=group_name)

        return JsonResponse({"status": 0,"message": "Group created", "group": {"group_name": chat_group.group_name}}, status=status.HTTP_201_CREATED)

