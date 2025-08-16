from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework.views import APIView


class ListUsernameAPIView(APIView):

    def get(self, request):
        # Fetch all usernames as a list
        usernames = list(User.objects.values_list("username", flat=True))

        return JsonResponse({
            "message": "Welcome to Chat App using Websockets",
            "data": usernames
        }, status=200)
