from rest_framework.response import Response
from django.http import JsonResponse

class ResponseHandler:
    @staticmethod
    def success(data=None, message="Success", code=0, status_code=200):
        return JsonResponse({
            "code": code,
            "status": "success",
            "message": message,
            "data": data
        }, status=status_code)
    @staticmethod
    def error(message="Error", errors=None, code=1, status_code=200):
        return JsonResponse({
            "code": code,
            "status": "error",
            "message": message,
            "data": errors
        }, status=status_code)

    @staticmethod
    def rest_success(data=None, message="Success", code=0, status_code=200):
        return Response({
            "status": code,
            "message": message,
            "data": data
        }, status=status_code)

    @staticmethod
    def rest_error(message="Error", errors=None, code=1, status_code=200):
        return Response({
            "status": code,
            "message": message,
            "errors": errors
        }, status=status_code)
