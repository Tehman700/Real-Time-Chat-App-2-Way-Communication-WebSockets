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



class LoggedInUserEmailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user  # the authenticated user

        return JsonResponse({
            "message": "Fetched logged in user email successfully",
            "data": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
            }
        }, status=200)