from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated


class ListUsernameAPIView(APIView):
    permission_classes = [IsAuthenticated]  # Add authentication requirement

    def get(self, request):
        # Fetch all users with id and username
        users = list(User.objects.values("id", "username"))

        return JsonResponse({
            "message": "Welcome to Chat App using Websockets",
            "data": users
        }, status=200)