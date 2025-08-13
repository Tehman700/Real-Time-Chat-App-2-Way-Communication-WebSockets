from django.contrib.auth.models import User
from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from api.models.authentication_models import User_Data
from api.serializers.user_data_serializer import User_Data_Serializer, LoginSerializer
from api.utils.response_handler import ResponseHandler


class LoginViewSet(viewsets.ViewSet):

    def dispatch(self, request, *args, **kwargs):
        if request.method != 'POST':
            # log_error(request, 'Other than POST Request fired', 200)
            return ResponseHandler.error(
                message=f"Method {request.method} not allowed. Only POST is supported.",
                code=1
            )
        return super().dispatch(request, *args, **kwargs)

    def create(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.validated_data

                try:
                    user_profile = User_Data.objects.get(user=user)
                except User_Data.DoesNotExist:
                    # log_error(request, f'User profile does not exist for {user}', 200)
                    return ResponseHandler.rest_error(
                        message="User profile not found",
                        errors="User profile does not exist"
                    )

                refresh = RefreshToken.for_user(user)
                user_data = {
                    "id": user.id,
                    "username": user.username,
                    "password" : request.data.get('password'),
                    "email": user.email or "Not provided",
                    "date_joined": user.date_joined,
                    "is_active": user.is_active,
                    "mobile_number": user_profile.mobile_number,
                    "profile_created": user_profile.created
                }

                return ResponseHandler.rest_success({
                    "user": user_data,
                    "tokens": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh)
                    }
                }, message="Login successful")

            # log_error(request, "Login Failed for user", 200)
            return ResponseHandler.rest_error(
                message="Login failed",
                errors=serializer.errors
            )

        except Exception as e:
            # log_error(request, 'Internal Server Error Occurred', 200)

            return ResponseHandler.rest_error(
                message="Internal error occurred",
                errors=str(e),
                code=-1
            )



class RegisterAPIView(APIView):
    def post(self, request):
        try:
            required_fields = ['username', 'password', 'email', 'mobile_number']
            missing_fields = [field for field in required_fields if not request.data.get(field)]

            if missing_fields:
                # log_error(request, 'Missing Fields for Registration', 200)

                return ResponseHandler.error(
                    message="Missing required fields",
                    errors={field: "This field is required." for field in missing_fields}
                )

            data = request.data
            username = data['username']
            password = data['password']
            email = data['email']
            mobile = data['mobile_number']

            if User.objects.filter(username=username).exists():
                return ResponseHandler.error("Username already exists")

            elif  User.objects.filter(email=email).exists():
                return ResponseHandler.error("Email already exists")

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )

            profile = User_Data.objects.create(
                user=user,
                email_address=email,
                mobile_number=mobile,
            )

            profile_serializer = User_Data_Serializer(profile)

            return ResponseHandler.success(
                message="User successfully registered",
                data=profile_serializer.data
            )

        except Exception as e:
            # log_error(request, 'Something went wrong during registration', 200)
            return ResponseHandler.error(
                message="Something went wrong during registration",
                errors=str(e)
            )

    def http_method_not_allowed(self, request, *args, **kwargs):
        # log_error(request, 'Method Not Allowed', 200)
        return ResponseHandler.error(
            message="Only POST is allowed on register",
            code=-1,
            errors=None
        )









class AlreadyExistsAPIView(APIView):
    def post(self, request):

        fetched_username = request.data.get('username')
        fetched_email = request.data.get('email')
        fetched_mobile_number = request.data.get('mobile_number')

        print(fetched_email, fetched_mobile_number,fetched_username)

        if fetched_username and fetched_email and fetched_mobile_number:

            if User.objects.filter(username=fetched_username).exists():
                return JsonResponse({
                    'status' : -1,
                    'message' : 'Username already exists'
                },status=200)

            elif User.objects.filter(email=fetched_email).exists():
                return JsonResponse({
                    'status' : -2,
                    'message' : 'Email already exists'
                }, status=200)

            elif User_Data.objects.filter(mobile_number=fetched_mobile_number).exists():
                return JsonResponse({
                    'status' : -3,
                    'message' : 'Mobile number already exists'
                }, status = 200)

            else:
                return JsonResponse({
                    'status' : -4,
                    'message' : 'New Entry in Registration',
                }, status =200)



        else:
            return JsonResponse({
                'status' : -1,
                'message' : "Enter all Fields",
            }, status =200)


















